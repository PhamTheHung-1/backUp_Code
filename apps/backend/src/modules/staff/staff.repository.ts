import { db } from "@be/db";
import { clinicMemberships, membershipRoles } from "@be/db/schema/clinic-membership-schema";
import { roles } from "@be/db/schema/role-schema";
import { staffJobTitles, staffProfiles } from "@be/db/schema/staff-schema";
import { usersTableSchema as users } from "@be/db/schema/user-schema";
import { and, asc, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { hashPassword } from "@be/shared/utils/crypto";

export type StaffListQuery = {
	page: number;
	pageSize: number;
	search?: string;
	jobTitleId?: number;
	employmentStatus?: "active" | "on_leave" | "terminated";
	membershipStatus?: "invited" | "active" | "suspended" | "removed";
	roleId?: number;
	userStatus?: boolean;
	sortBy?: "fullName" | "staffCode" | "startedAt" | "createdAt";
	sortOrder?: "asc" | "desc";
};

export type StaffRoleRecord = { id: number; name: string | null; status: boolean };
export type StaffUserRecord = { id: number; email: string | null; username: string | null; status: boolean | null };
export type StaffJobTitleRecord = {
	id: number;
	clinicId: number;
	code: string;
	name: string;
	status: boolean;
	createdAt: string | null;
	updatedAt: string | null;
};
export type StaffProfileRecord = typeof staffProfiles.$inferSelect;

export type StaffDetailRecord = {
	profileId: number;
	membershipId: number;
	clinicId: number;
	staffCode: string;
	fullName: string;
	phone: string | null;
	dateOfBirth: string | null;
	gender: "male" | "female" | "other" | "unknown" | null;
	address: string | null;
	jobTitle: StaffJobTitleRecord | null;
	specialties: string[];
	employmentStatus: "active" | "on_leave" | "terminated";
	startedAt: string | null;
	endedAt: string | null;
	note: string | null;
	user: StaffUserRecord;
	membership: {
		status: "invited" | "active" | "suspended" | "removed";
		branchScope: "all" | "assigned";
		joinedAt: string | null;
	};
	roles: StaffRoleRecord[];
	createdAt: string | null;
	updatedAt: string | null;
};

function dateString(value: Date | string | null | undefined): string | null {
	if (!value) return null;
	if (value instanceof Date) return value.toISOString();
	return value;
}

function escapeSearch(value: string) {
	return `%${value.replace(/[\\%_]/g, "\\$&")}%`;
}

function baseSelection() {
	return {
		profileId: staffProfiles.id,
		membershipId: staffProfiles.membershipId,
		clinicId: staffProfiles.clinicId,
		staffCode: staffProfiles.staffCode,
		fullName: staffProfiles.fullName,
		phone: staffProfiles.phone,
		dateOfBirth: staffProfiles.dateOfBirth,
		gender: staffProfiles.gender,
		address: staffProfiles.address,
		jobTitleId: staffProfiles.jobTitleId,
		specialties: staffProfiles.specialties,
		employmentStatus: staffProfiles.employmentStatus,
		startedAt: staffProfiles.startedAt,
		endedAt: staffProfiles.endedAt,
		note: staffProfiles.note,
		createdAt: staffProfiles.createdAt,
		updatedAt: staffProfiles.updatedAt,
		userId: users.id,
		userEmail: users.email,
		userUsername: users.username,
		userStatus: users.status,
		membershipStatus: clinicMemberships.status,
		branchScope: clinicMemberships.branchScope,
		joinedAt: clinicMemberships.joinedAt,
		jobTitleCode: staffJobTitles.code,
		jobTitleName: staffJobTitles.name,
		jobTitleStatus: staffJobTitles.status,
		jobTitleCreatedAt: staffJobTitles.createdAt,
		jobTitleUpdatedAt: staffJobTitles.updatedAt,
	};
}

type StaffSelectionRow = {
	profileId: number;
	membershipId: number;
	clinicId: number;
	staffCode: string;
	fullName: string;
	phone: string | null;
	dateOfBirth: string | null;
	gender: string | null;
	address: string | null;
	jobTitleId: number | null;
	specialties: string[] | null;
	employmentStatus: string;
	startedAt: string | null;
	endedAt: string | null;
	note: string | null;
	createdAt: Date | string | null;
	updatedAt: Date | string | null;
	userId: number;
	userEmail: string | null;
	userUsername: string | null;
	userStatus: boolean | null;
	membershipStatus: string;
	branchScope: string | null;
	joinedAt: Date | string | null;
	jobTitleCode: string | null;
	jobTitleName: string | null;
	jobTitleStatus: boolean | null;
	jobTitleCreatedAt: Date | string | null;
	jobTitleUpdatedAt: Date | string | null;
};

function normalizeRow(row: StaffSelectionRow): StaffDetailRecord {
	const jobTitle =
		row.jobTitleId === null
			? null
			: ({
					id: row.jobTitleId,
					clinicId: row.clinicId,
					code: row.jobTitleCode ?? "",
					name: row.jobTitleName ?? "",
					status: row.jobTitleStatus ?? false,
					createdAt: dateString(row.jobTitleCreatedAt),
					updatedAt: dateString(row.jobTitleUpdatedAt),
				} satisfies StaffJobTitleRecord);
	return {
		profileId: row.profileId,
		membershipId: row.membershipId,
		clinicId: row.clinicId,
		staffCode: row.staffCode,
		fullName: row.fullName,
		phone: row.phone,
		dateOfBirth: row.dateOfBirth,
		gender: row.gender as StaffDetailRecord["gender"],
		address: row.address,
		jobTitle,
		specialties: row.specialties ?? [],
		employmentStatus: row.employmentStatus as StaffDetailRecord["employmentStatus"],
		startedAt: row.startedAt,
		endedAt: row.endedAt,
		note: row.note,
		user: {
			id: row.userId,
			email: row.userEmail,
			username: row.userUsername,
			status: row.userStatus,
		},
		membership: {
			status: row.membershipStatus as StaffDetailRecord["membership"]["status"],
			branchScope: row.branchScope === "all" ? "all" : "assigned",
			joinedAt: dateString(row.joinedAt),
		},
		roles: [],
		createdAt: dateString(row.createdAt),
		updatedAt: dateString(row.updatedAt),
	};
}

function detailQuery(clinicId: number, membershipId?: number, profileId?: number) {
	const where = membershipId !== undefined
		? and(eq(staffProfiles.clinicId, clinicId), eq(staffProfiles.membershipId, membershipId))
		: profileId !== undefined
			? and(eq(staffProfiles.clinicId, clinicId), eq(staffProfiles.id, profileId))
			: undefined;
	return db
		.select(baseSelection())
		.from(staffProfiles)
		.innerJoin(clinicMemberships, and(
			eq(clinicMemberships.clinicId, staffProfiles.clinicId),
			eq(clinicMemberships.id, staffProfiles.membershipId),
		))
		.innerJoin(users, eq(users.id, clinicMemberships.userId))
		.leftJoin(staffJobTitles, and(
			eq(staffJobTitles.clinicId, staffProfiles.clinicId),
			eq(staffJobTitles.id, staffProfiles.jobTitleId),
		))
		.where(where);
}

async function attachRoles(clinicId: number, membershipIds: number[], rows: StaffDetailRecord[]) {
	if (membershipIds.length === 0) return rows;
	const roleRows = await db
		.select({
			membershipId: membershipRoles.membershipId,
			id: roles.id,
			name: roles.name,
			status: roles.status,
		})
		.from(membershipRoles)
		.innerJoin(roles, and(eq(roles.clinicId, membershipRoles.clinicId), eq(roles.id, membershipRoles.roleId)))
		.where(and(eq(membershipRoles.clinicId, clinicId), inArray(membershipRoles.membershipId, membershipIds)));
	for (const row of rows) {
		row.roles = roleRows.filter(role => role.membershipId === row.membershipId).map(role => ({ id: role.id, name: role.name, status: role.status ?? false }));
	}
	return rows;
}

export const staffRepository = {
	async listByClinic(clinicId: number, query: StaffListQuery) {
		const conditions = [eq(staffProfiles.clinicId, clinicId)];
		if (query.search) {
			const pattern = escapeSearch(query.search);
			conditions.push(or(
				ilike(staffProfiles.fullName, pattern),
				ilike(staffProfiles.staffCode, pattern),
				ilike(users.email, pattern),
				ilike(users.username, pattern),
				ilike(staffProfiles.phone, pattern),
			)!);
		}
		if (query.jobTitleId !== undefined) conditions.push(eq(staffProfiles.jobTitleId, query.jobTitleId));
		if (query.employmentStatus) conditions.push(eq(staffProfiles.employmentStatus, query.employmentStatus));
		if (query.membershipStatus) conditions.push(eq(clinicMemberships.status, query.membershipStatus));
		if (query.roleId !== undefined) {
			conditions.push(sql`exists (
				select 1 from ${membershipRoles}
				where ${membershipRoles.clinicId} = ${clinicId}
				and ${membershipRoles.membershipId} = ${staffProfiles.membershipId}
				and ${membershipRoles.roleId} = ${query.roleId}
			)`);
		}
		if (query.userStatus !== undefined) conditions.push(eq(users.status, query.userStatus));

		const where = and(...conditions);
		const sortBy =
			query.sortBy === "staffCode" ? staffProfiles.staffCode :
			query.sortBy === "startedAt" ? staffProfiles.startedAt :
			query.sortBy === "createdAt" ? staffProfiles.createdAt :
			staffProfiles.fullName;
		const ordering = query.sortOrder === "desc" ? desc(sortBy) : asc(sortBy);

		const [rawItems, totalRows] = await Promise.all([
			db.select(baseSelection())
				.from(staffProfiles)
				.innerJoin(clinicMemberships, and(
					eq(clinicMemberships.clinicId, staffProfiles.clinicId),
					eq(clinicMemberships.id, staffProfiles.membershipId),
				))
				.innerJoin(users, eq(users.id, clinicMemberships.userId))
				.leftJoin(staffJobTitles, and(
					eq(staffJobTitles.clinicId, staffProfiles.clinicId),
					eq(staffJobTitles.id, staffProfiles.jobTitleId),
				))
				.where(where)
				.orderBy(ordering, asc(staffProfiles.id))
				.limit(query.pageSize)
				.offset((query.page - 1) * query.pageSize),
			db.select({ total: count() })
				.from(staffProfiles)
				.innerJoin(clinicMemberships, and(
					eq(clinicMemberships.clinicId, staffProfiles.clinicId),
					eq(clinicMemberships.id, staffProfiles.membershipId),
				))
				.innerJoin(users, eq(users.id, clinicMemberships.userId))
				.leftJoin(staffJobTitles, and(
					eq(staffJobTitles.clinicId, staffProfiles.clinicId),
					eq(staffJobTitles.id, staffProfiles.jobTitleId),
				))
				.where(where),
		]);
		const items = rawItems.map(row => normalizeRow(row));
		await attachRoles(clinicId, items.map(item => item.membershipId), items);
		return { items, total: Number(totalRows[0]?.total ?? 0), page: query.page, pageSize: query.pageSize };
	},

	async findByClinic(clinicId: number, membershipId: number): Promise<StaffDetailRecord | null> {
		const rows = await detailQuery(clinicId, membershipId);
		const record = rows[0] ? normalizeRow(rows[0]) : null;
		if (!record) return null;
		await attachRoles(clinicId, [membershipId], [record]);
		return record;
	},

	async findStaffProfileByClinicAndId(clinicId: number, profileId: number): Promise<StaffProfileRecord | null> {
		const rows = await db.select().from(staffProfiles).where(and(eq(staffProfiles.clinicId, clinicId), eq(staffProfiles.id, profileId)));
		return rows[0] ?? null;
	},

	async findMembershipByClinic(clinicId: number, membershipId: number) {
		const rows = await db
			.select({
				id: clinicMemberships.id,
				clinicId: clinicMemberships.clinicId,
				userId: clinicMemberships.userId,
				status: clinicMemberships.status,
				branchScope: clinicMemberships.branchScope,
			})
			.from(clinicMemberships)
			.where(and(eq(clinicMemberships.clinicId, clinicId), eq(clinicMemberships.id, membershipId)));
		return rows[0] ?? null;
	},

	async findUserById(userId: number): Promise<StaffUserRecord | null> {
		const rows = await db.select({ id: users.id, email: users.email, username: users.username, status: users.status }).from(users).where(eq(users.id, userId));
		return rows[0] ?? null;
	},

	async findUserByEmail(email: string) {
		const rows = await db.select({ id: users.id, email: users.email, username: users.username, status: users.status }).from(users).where(eq(users.email, email));
		return rows[0] ?? null;
	},

	async findMembershipByUserAndClinic(clinicId: number, userId: number) {
		const rows = await db.select({ id: clinicMemberships.id, status: clinicMemberships.status }).from(clinicMemberships).where(and(
			eq(clinicMemberships.clinicId, clinicId),
			eq(clinicMemberships.userId, userId),
		));
		return rows[0] ?? null;
	},

	async findJobTitleByClinic(clinicId: number, jobTitleId: number) {
		const rows = await db.select().from(staffJobTitles).where(and(eq(staffJobTitles.clinicId, clinicId), eq(staffJobTitles.id, jobTitleId)));
		return rows[0] ?? null;
	},

	async findJobTitleByCode(clinicId: number, code: string) {
		const rows = await db.select({ id: staffJobTitles.id }).from(staffJobTitles).where(and(
			eq(staffJobTitles.clinicId, clinicId),
			sql`upper(btrim(${staffJobTitles.code})) = upper(btrim(${code}))`,
		));
		return rows[0] ?? null;
	},

	async findStaffCodeByClinic(clinicId: number, staffCode: string, excludeMembershipId?: number) {
		const excluded = excludeMembershipId === undefined ? undefined : sql`${staffProfiles.membershipId} <> ${excludeMembershipId}`;
		const rows = await db.select({ id: staffProfiles.id }).from(staffProfiles).where(and(
			eq(staffProfiles.clinicId, clinicId),
			sql`upper(btrim(${staffProfiles.staffCode})) = upper(btrim(${staffCode}))`,
			excluded,
		));
		return rows[0] ?? null;
	},

	async findActiveRoleByClinic(clinicId: number, roleId: number) {
		const rows = await db.select({ id: roles.id, name: roles.name, status: roles.status }).from(roles).where(and(
			eq(roles.clinicId, clinicId),
			eq(roles.id, roleId),
			eq(roles.status, true),
		));
		return rows[0] ?? null;
	},

	async listJobTitles(clinicId: number, status?: boolean) {
		const where = status === undefined ? eq(staffJobTitles.clinicId, clinicId) : and(eq(staffJobTitles.clinicId, clinicId), eq(staffJobTitles.status, status));
		return db.select().from(staffJobTitles).where(where).orderBy(asc(staffJobTitles.name), asc(staffJobTitles.id));
	},

	async createJobTitle(clinicId: number, data: { code: string; name: string; status?: boolean }) {
		const rows = await db.insert(staffJobTitles).values({
			clinicId,
			code: data.code.trim(),
			name: data.name.trim(),
			status: data.status ?? true,
		}).returning();
		return rows[0];
	},

	async updateJobTitle(clinicId: number, id: number, data: { code?: string; name?: string; status?: boolean }) {
		const values: Partial<typeof staffJobTitles.$inferInsert> = {};
		if (data.code !== undefined) values.code = data.code.trim();
		if (data.name !== undefined) values.name = data.name.trim();
		if (data.status !== undefined) values.status = data.status;
		const rows = await db.update(staffJobTitles).set(values).where(and(
			eq(staffJobTitles.clinicId, clinicId),
			eq(staffJobTitles.id, id),
		)).returning();
		return rows[0] ?? null;
	},

	async updateProfileByClinic(clinicId: number, membershipId: number, data: Partial<typeof staffProfiles.$inferInsert>) {
		const rows = await db.update(staffProfiles).set(data).where(and(
			eq(staffProfiles.clinicId, clinicId),
			eq(staffProfiles.membershipId, membershipId),
		)).returning();
		return rows[0] ?? null;
	},

	async updateMembershipStatus(clinicId: number, membershipId: number, status: string) {
		const rows = await db.update(clinicMemberships).set({ status }).where(and(
			eq(clinicMemberships.clinicId, clinicId),
			eq(clinicMemberships.id, membershipId),
		)).returning({ id: clinicMemberships.id });
		return rows[0] ?? null;
	},

	async updateUserAccount(userId: number, data: { email?: string; username?: string }) {
		const rows = await db.update(users).set(data).where(eq(users.id, userId)).returning({ id: users.id });
		return rows[0] ?? null;
	},

	async replaceMembershipRoles(clinicId: number, membershipId: number, roleIds: number[]) {
		return db.transaction(async tx => {
			await tx.delete(membershipRoles).where(and(
				eq(membershipRoles.clinicId, clinicId),
				eq(membershipRoles.membershipId, membershipId),
			));
			if (roleIds.length) {
				await tx.insert(membershipRoles).values(roleIds.map(roleId => ({ clinicId, membershipId, roleId })));
			}
		});
	},

	async linkUserToMembership(clinicId: number, membershipId: number, userId: number) {
		return db.transaction(async tx => {
			const existing = await tx.select({ id: clinicMemberships.id }).from(clinicMemberships).where(and(
				eq(clinicMemberships.clinicId, clinicId),
				eq(clinicMemberships.userId, userId),
			));
			if (existing.length) return null;
			const rows = await tx.update(clinicMemberships).set({ userId }).where(and(
				eq(clinicMemberships.clinicId, clinicId),
				eq(clinicMemberships.id, membershipId),
			)).returning({ id: clinicMemberships.id });
			return rows[0] ?? null;
		});
	},

	async createStaff(clinicId: number, invitedBy: number, input: {
		profile: {
			staffCode: string;
			fullName: string;
			phone?: string | null;
			dateOfBirth?: string | null;
			gender?: "male" | "female" | "other" | "unknown" | null;
			address?: string | null;
			jobTitleId?: number | null;
			specialties?: string[];
			employmentStatus?: "active" | "on_leave" | "terminated";
			startedAt?: string | null;
			endedAt?: string | null;
			note?: string | null;
		};
		existingUserId?: number;
		newUser?: { email: string; username?: string; password: string; status?: boolean };
		membershipStatus: string;
		branchScope: "all" | "assigned";
		roleIds: number[];
	}) {
		return db.transaction(async tx => {
			let userId = input.existingUserId;
			if (input.newUser) {
				const { salt, hpass } = hashPassword(input.newUser.password);
				const [createdUser] = await tx.insert(users).values({
					email: input.newUser.email.trim(),
					username: input.newUser.username?.trim() || input.newUser.email.split("@")[0],
					status: input.newUser.status ?? true,
					roles: [],
					avatar: "",
					salt,
					hpass,
				}).returning({ id: users.id });
				userId = createdUser.id;
			}
			if (!userId) throw new Error("User is required");

			const existingMembership = await tx.select({ id: clinicMemberships.id }).from(clinicMemberships).where(and(
				eq(clinicMemberships.clinicId, clinicId),
				eq(clinicMemberships.userId, userId),
			));
			if (existingMembership.length) throw new Error("USER_ALREADY_IN_CLINIC");

			const [membership] = await tx.insert(clinicMemberships).values({
				clinicId,
				userId,
				status: input.membershipStatus,
				branchScope: input.branchScope,
				invitedBy,
				joinedAt: input.membershipStatus === "active" ? new Date() : null,
			}).returning({ id: clinicMemberships.id });

			const [profile] = await tx.insert(staffProfiles).values({
				...input.profile,
				clinicId,
				membershipId: membership.id,
			}).returning({ id: staffProfiles.id });

			if (input.roleIds.length) {
				await tx.insert(membershipRoles).values(input.roleIds.map(roleId => ({
					clinicId,
					membershipId: membership.id,
					roleId,
				})));
			}
			return { membershipId: membership.id, profileId: profile.id };
		});
	},
};

export type StaffRepository = typeof staffRepository;
