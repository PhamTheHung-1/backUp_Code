import { db } from "@be/db";
import { appointments, clinicBusinessHours } from "@be/db/schema/appointment-schema";
import { clinicMemberships, membershipRoles } from "@be/db/schema/clinic-membership-schema";
import { clinics } from "@be/db/schema/clinic-schema";
import { owners } from "@be/db/schema/owner-schema";
import { pets } from "@be/db/schema/pet-schema";
import { roles } from "@be/db/schema/role-schema";
import { usersTableSchema as users } from "@be/db/schema/user-schema";
import { and, asc, count, eq, getTableColumns, gte, inArray, isNull, lt, ne, sql } from "drizzle-orm";

export type AppointmentState = "booked" | "confirmed" | "arrived" | "in_exam" | "completed" | "cancelled" | "no_show";
export type AppointmentListQuery = {
	page?: number;
	pageSize?: number;
	from?: Date;
	to?: Date;
	status?: AppointmentState;
	veterinarianId?: number;
};
export type AppointmentRecord = typeof appointments.$inferSelect & {
	petName: string;
	petCode: string;
	ownerName: string;
	ownerPhone: string | null;
	veterinarianName: string | null;
};
export type ClinicHour = { weekday: number; openTime: string; closeTime: string };
export type AppointmentWriteData = {
	petId: number;
	ownerId: number;
	veterinarianId: number | null;
	startAt: Date;
	endAt: Date;
	reason: string | null;
};

const BUSY_STATES: AppointmentState[] = ["booked", "confirmed", "arrived", "in_exam"];

function appointmentConditions(clinicId: number, query: AppointmentListQuery) {
	const conditions = [eq(appointments.clinicId, clinicId)];
	if (query.from) conditions.push(gte(appointments.startAt, query.from));
	if (query.to) conditions.push(lt(appointments.startAt, query.to));
	if (query.status) conditions.push(eq(appointments.status, query.status));
	if (query.veterinarianId !== undefined) conditions.push(eq(appointments.veterinarianId, query.veterinarianId));
	return and(...conditions);
}

function detailSelection() {
	return {
		...getTableColumns(appointments),
		petName: pets.name,
		petCode: pets.petCode,
		ownerName: owners.fullName,
		ownerPhone: owners.phone,
		veterinarianName: sql<string | null>`CASE WHEN ${users.id} IS NULL THEN NULL ELSE COALESCE(NULLIF(${users.username}, ''), ${users.email}) END`,
	};
}

function appointmentDetailQuery(clinicId: number, id: number) {
	return db
		.select(detailSelection())
		.from(appointments)
		.innerJoin(pets, and(eq(pets.clinicId, appointments.clinicId), eq(pets.id, appointments.petId), eq(pets.ownerId, appointments.ownerId)))
		.innerJoin(owners, and(eq(owners.clinicId, appointments.clinicId), eq(owners.id, appointments.ownerId)))
		.leftJoin(users, eq(users.id, appointments.veterinarianId))
		.where(and(eq(appointments.clinicId, clinicId), eq(appointments.id, id)));
}

async function lockSchedule(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], clinicId: number, veterinarianId: number | null) {
	await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${`${clinicId}:${veterinarianId ?? "unassigned"}`}, 0))`);
}

async function assertNoConflict(
	tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
	clinicId: number,
	data: Pick<AppointmentWriteData, "veterinarianId" | "startAt" | "endAt">,
	excludeId?: number,
) {
	const conditions = [
		eq(appointments.clinicId, clinicId),
		inArray(appointments.status, BUSY_STATES),
		lt(appointments.startAt, data.endAt),
		gtEndAfterStart(data.startAt),
		data.veterinarianId === null ? isNull(appointments.veterinarianId) : eq(appointments.veterinarianId, data.veterinarianId),
	];
	if (excludeId !== undefined) conditions.push(ne(appointments.id, excludeId));
	const [conflict] = await tx
		.select({ id: appointments.id })
		.from(appointments)
		.where(and(...conditions))
		.limit(1);
	if (conflict) throw new AppointmentConflictError();
}

function gtEndAfterStart(startAt: Date) {
	return sql`${appointments.endAt} > ${startAt}`;
}

export class AppointmentConflictError extends Error {
	constructor() {
		super("The selected veterinarian already has an overlapping appointment");
		this.name = "AppointmentConflictError";
	}
}

export const appointmentsRepository = {
	async listByClinic(clinicId: number, query: AppointmentListQuery) {
		const where = appointmentConditions(clinicId, query);
		const page = query.page ?? 1;
		const pageSize = query.pageSize ?? 20;
		const [items, [{ total }]] = await Promise.all([
			db
				.select(detailSelection())
				.from(appointments)
				.innerJoin(pets, and(eq(pets.clinicId, appointments.clinicId), eq(pets.id, appointments.petId), eq(pets.ownerId, appointments.ownerId)))
				.innerJoin(owners, and(eq(owners.clinicId, appointments.clinicId), eq(owners.id, appointments.ownerId)))
				.leftJoin(users, eq(users.id, appointments.veterinarianId))
				.where(where)
				.orderBy(asc(appointments.startAt), asc(appointments.id))
				.limit(pageSize)
				.offset((page - 1) * pageSize),
			db.select({ total: count() }).from(appointments).where(where),
		]);
		return { items, total, page, pageSize };
	},

	async findByClinic(clinicId: number, id: number): Promise<AppointmentRecord | null> {
		const rows = await appointmentDetailQuery(clinicId, id);
		return rows[0] ?? null;
	},

	async findActivePetByClinic(clinicId: number, petId: number): Promise<{ id: number; ownerId: number } | null> {
		const rows = await db
			.select({ id: pets.id, ownerId: pets.ownerId })
			.from(pets)
			.innerJoin(owners, and(eq(owners.clinicId, pets.clinicId), eq(owners.id, pets.ownerId)))
			.where(and(eq(pets.clinicId, clinicId), eq(pets.id, petId), eq(pets.status, true), eq(owners.status, true)));
		return rows[0] ?? null;
	},

	async isActiveVeterinarianByClinic(clinicId: number, veterinarianId: number) {
		const rows = await db
			.select({ userId: users.id })
			.from(clinicMemberships)
			.innerJoin(
				membershipRoles,
				and(eq(membershipRoles.clinicId, clinicMemberships.clinicId), eq(membershipRoles.membershipId, clinicMemberships.id)),
			)
			.innerJoin(roles, and(eq(roles.clinicId, membershipRoles.clinicId), eq(roles.id, membershipRoles.roleId), eq(roles.status, true)))
			.innerJoin(users, and(eq(users.id, clinicMemberships.userId), eq(users.status, true)))
			.where(
				and(
					eq(clinicMemberships.clinicId, clinicId),
					eq(clinicMemberships.userId, veterinarianId),
					eq(clinicMemberships.status, "active"),
					sql`lower(btrim(${roles.name})) in ('doctor', 'veterinarian')`,
				),
			)
			.limit(1);
		return rows.length > 0;
	},

	async listVeterinariansByClinic(clinicId: number) {
		return db
			.selectDistinct({
				id: users.id,
				name: sql<string>`COALESCE(NULLIF(${users.username}, ''), ${users.email})`,
			})
			.from(clinicMemberships)
			.innerJoin(
				membershipRoles,
				and(eq(membershipRoles.clinicId, clinicMemberships.clinicId), eq(membershipRoles.membershipId, clinicMemberships.id)),
			)
			.innerJoin(roles, and(eq(roles.clinicId, membershipRoles.clinicId), eq(roles.id, membershipRoles.roleId), eq(roles.status, true)))
			.innerJoin(users, and(eq(users.id, clinicMemberships.userId), eq(users.status, true)))
			.where(
				and(
					eq(clinicMemberships.clinicId, clinicId),
					eq(clinicMemberships.status, "active"),
					sql`lower(btrim(${roles.name})) in ('doctor', 'veterinarian')`,
				),
			)
			.orderBy(asc(users.username), asc(users.id));
	},

	async getClinicSettings(clinicId: number): Promise<{ timezone: string; status: boolean } | null> {
		const rows = await db.select({ timezone: clinics.timezone, status: clinics.status }).from(clinics).where(eq(clinics.id, clinicId));
		return rows[0] ?? null;
	},

	async listBusinessHoursByClinic(clinicId: number): Promise<ClinicHour[]> {
		const rows = await db
			.select({ weekday: clinicBusinessHours.weekday, openTime: clinicBusinessHours.openTime, closeTime: clinicBusinessHours.closeTime })
			.from(clinicBusinessHours)
			.where(eq(clinicBusinessHours.clinicId, clinicId))
			.orderBy(asc(clinicBusinessHours.weekday));
		return rows.map(day => ({ ...day, openTime: day.openTime.slice(0, 5), closeTime: day.closeTime.slice(0, 5) }));
	},

	async replaceBusinessHoursByClinic(clinicId: number, days: ClinicHour[]) {
		return db.transaction(async tx => {
			await tx.delete(clinicBusinessHours).where(eq(clinicBusinessHours.clinicId, clinicId));
			if (days.length) await tx.insert(clinicBusinessHours).values(days.map(day => ({ ...day, clinicId })));
			return days;
		});
	},

	async listBusyByClinic(clinicId: number, startAt: Date, endAt: Date, veterinarianIds?: number[]) {
		const conditions = [
			eq(appointments.clinicId, clinicId),
			inArray(appointments.status, BUSY_STATES),
			lt(appointments.startAt, endAt),
			gtEndAfterStart(startAt),
		];
		if (veterinarianIds) {
			if (veterinarianIds.length === 0) return [];
			conditions.push(inArray(appointments.veterinarianId, veterinarianIds));
		}
		return db
			.select({ veterinarianId: appointments.veterinarianId, startAt: appointments.startAt, endAt: appointments.endAt })
			.from(appointments)
			.where(and(...conditions));
	},

	async createByClinic(clinicId: number, createdBy: number, data: AppointmentWriteData): Promise<AppointmentRecord> {
		const id = await db.transaction(async tx => {
			await lockSchedule(tx, clinicId, data.veterinarianId);
			await assertNoConflict(tx, clinicId, data);
			const [row] = await tx
				.insert(appointments)
				.values({ ...data, clinicId, createdBy, status: "booked" })
				.returning({ id: appointments.id });
			return row.id;
		});
		const appointment = await this.findByClinic(clinicId, id);
		if (!appointment) throw new Error("Created appointment could not be loaded");
		return appointment;
	},

	async updateBookedByClinic(clinicId: number, id: number, data: AppointmentWriteData): Promise<AppointmentRecord | null> {
		const idResult = await db.transaction(async tx => {
			const [current] = await tx
				.select({ id: appointments.id, status: appointments.status, veterinarianId: appointments.veterinarianId })
				.from(appointments)
				.where(and(eq(appointments.clinicId, clinicId), eq(appointments.id, id)))
				.for("update");
			if (!current || !["booked", "confirmed"].includes(current.status)) return null;
			const veterinarianIds = [...new Set([current.veterinarianId, data.veterinarianId].filter((value): value is number => value !== null))].sort(
				(a, b) => a - b,
			);
			for (const veterinarianId of veterinarianIds) await lockSchedule(tx, clinicId, veterinarianId);
			if (current.veterinarianId === null || data.veterinarianId === null) await lockSchedule(tx, clinicId, null);
			await assertNoConflict(tx, clinicId, data, id);
			const [updated] = await tx
				.update(appointments)
				.set({
					petId: data.petId,
					ownerId: data.ownerId,
					veterinarianId: data.veterinarianId,
					startAt: data.startAt,
					endAt: data.endAt,
					reason: data.reason,
				})
				.where(and(eq(appointments.clinicId, clinicId), eq(appointments.id, id)))
				.returning({ id: appointments.id });
			return updated?.id ?? null;
		});
		return idResult === null ? null : this.findByClinic(clinicId, idResult);
	},

	async transitionByClinic(clinicId: number, id: number, expectedStates: AppointmentState[], nextState: AppointmentState) {
		const rows = await db
			.update(appointments)
			.set({ status: nextState })
			.where(and(eq(appointments.clinicId, clinicId), eq(appointments.id, id), inArray(appointments.status, expectedStates)))
			.returning({ id: appointments.id });
		return rows[0] ? this.findByClinic(clinicId, id) : null;
	},
};

export type AppointmentsRepository = typeof appointmentsRepository;
