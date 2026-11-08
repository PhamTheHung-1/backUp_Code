import { db } from "@be/db";
import { owners } from "@be/db/schema/owner-schema";
import { petCodeCounters, pets } from "@be/db/schema/pet-schema";
import { and, asc, count, eq, getTableColumns, ilike, or, sql } from "drizzle-orm";
import { formatPetCode, getPetCodePrefix } from "./pet-code";

export type PetListQuery = {
	page: number;
	pageSize: number;
	search?: string;
	species?: string;
	sex?: "male" | "female" | "unknown";
	status?: boolean;
};
export type PetRecord = typeof pets.$inferSelect & { 
	ownerName: string;
	ownerPhone: string | null;
 };

function searchPattern(search: string) {
	return `%${search.replace(/[\\%_]/g, "\\$&")}%`;
}

function listConditions(clinicId: number, query: PetListQuery) {
	const conditions = [eq(pets.clinicId, clinicId)];
	if (query.species) conditions.push(eq(pets.species, query.species));
	if (query.sex) conditions.push(eq(pets.sex, query.sex));
	if (query.status !== undefined) conditions.push(eq(pets.status, query.status));
	if (query.search) {
		const pattern = searchPattern(query.search);
		const searchCondition = or(
			ilike(pets.name, pattern),
			ilike(pets.species, pattern),
			ilike(pets.breed, pattern),
			ilike(pets.microchipNumber, pattern),
			ilike(pets.petCode, pattern),
			ilike(owners.fullName, pattern),
		);
		if (!searchCondition) throw new Error("Unable to build pet search condition");
		conditions.push(searchCondition);
	}
	return and(...conditions);
}

export const petsRepository = {
	async listByClinic(clinicId: number, query: PetListQuery) {
		const where = listConditions(clinicId, query);
		const [items, [{ total }]] = await Promise.all([
			db
				.select({ ...getTableColumns(pets), ownerName: owners.fullName, ownerPhone: owners.phone })
				.from(pets)
				.innerJoin(owners, and(eq(owners.clinicId, pets.clinicId), eq(owners.id, pets.ownerId)))
				.where(where)
				.orderBy(asc(pets.name), asc(pets.id))
				.limit(query.pageSize)
				.offset((query.page - 1) * query.pageSize),
			db
				.select({ total: count() })
				.from(pets)
				.innerJoin(owners, and(eq(owners.clinicId, pets.clinicId), eq(owners.id, pets.ownerId)))
				.where(where),
		]);
		return { items, total, page: query.page, pageSize: query.pageSize };
	},

	async findByClinic(clinicId: number, id: number): Promise<PetRecord | null> {
		const rows = await db
			.select({ ...getTableColumns(pets), ownerName: owners.fullName,ownerPhone: owners.phone  })
			.from(pets)
			.innerJoin(owners, and(eq(owners.clinicId, pets.clinicId), eq(owners.id, pets.ownerId)))
			.where(and(eq(pets.clinicId, clinicId), eq(pets.id, id)));
		return rows[0] ?? null;
	},

	async ownerExistsByClinic(clinicId: number, ownerId: number) {
		const rows = await db
			.select({ id: owners.id })
			.from(owners)
			.where(and(eq(owners.clinicId, clinicId), eq(owners.id, ownerId)));
		return rows.length > 0;
	},

	async createByClinic(
		clinicId: number,
		data: {
			ownerId: number;
			name: string;
			species: string;
			sex?: "male" | "female" | "unknown";
			breed?: string;
			dateOfBirth?: string;
			color?: string;
			microchipNumber?: string;
		},
	): Promise<PetRecord | null> {
		const prefix = getPetCodePrefix(data.species);
		const petId = await db.transaction(async tx => {
			const [counter] = await tx
				.insert(petCodeCounters)
				.values({ clinicId, prefix, lastNumber: 1 })
				.onConflictDoUpdate({
					target: [petCodeCounters.clinicId, petCodeCounters.prefix],
					set: { lastNumber: sql`${petCodeCounters.lastNumber} + 1` },
				})
				.returning({ sequence: petCodeCounters.lastNumber });
			const [pet] = await tx
				.insert(pets)
				.values({
					clinicId,
					petCode: formatPetCode(prefix, counter.sequence),
					ownerId: data.ownerId,
					name: data.name,
					species: data.species,
					sex: data.sex,
					breed: data.breed,
					dateOfBirth: data.dateOfBirth,
					color: data.color,
					microchipNumber: data.microchipNumber,
				})
				.returning({ id: pets.id });
			return pet.id;
		});
		return this.findByClinic(clinicId, petId);
	},

	async updateByClinic(
		clinicId: number,
		id: number,
		data: {
			ownerId?: number;
			name?: string;
			species?: string;
			sex?: "male" | "female" | "unknown";
			breed?: string;
			dateOfBirth?: string;
			color?: string;
			microchipNumber?: string;
			status?: boolean;
		},
	): Promise<PetRecord | null> {
		const rows = await db
			.update(pets)
			.set({
				ownerId: data.ownerId,
				name: data.name,
				species: data.species,
				sex: data.sex,
				breed: data.breed,
				dateOfBirth: data.dateOfBirth,
				color: data.color,
				microchipNumber: data.microchipNumber,
				status: data.status,
			})
			.where(and(eq(pets.clinicId, clinicId), eq(pets.id, id)))
			.returning({ id: pets.id });
		return rows[0] ? this.findByClinic(clinicId, rows[0].id) : null;
	},
};

export type PetsRepository = typeof petsRepository;
