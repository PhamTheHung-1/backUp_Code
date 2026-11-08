import { db } from "@be/db";
import { owners } from "@be/db/schema/owner-schema";
import { and, asc, count, eq, ilike, or } from "drizzle-orm";

export type OwnerListQuery = {
	page: number;
	pageSize: number;
	search?: string;
	status?: boolean;
};
export type OwnerRecord = typeof owners.$inferSelect;

function searchPattern(search: string) {
	return `%${search.replace(/[\\%_]/g, "\\$&")}%`;
}

export const ownersRepository = {
	async listByClinic(clinicId: number, query: OwnerListQuery) {
		const conditions = [eq(owners.clinicId, clinicId)];
		if (query.status !== undefined) conditions.push(eq(owners.status, query.status));
		if (query.search) {
			const pattern = searchPattern(query.search);
			const searchCondition = or(ilike(owners.fullName, pattern), ilike(owners.phone, pattern), ilike(owners.email, pattern));
			if (!searchCondition) throw new Error("Unable to build owner search condition");
			conditions.push(searchCondition);
		}
		const where = and(...conditions);
		const [items, [{ total }]] = await Promise.all([
			db
				.select()
				.from(owners)
				.where(where)
				.orderBy(asc(owners.fullName), asc(owners.id))
				.limit(query.pageSize)
				.offset((query.page - 1) * query.pageSize),
			db.select({ total: count() }).from(owners).where(where),
		]);
		return { items, total, page: query.page, pageSize: query.pageSize };
	},

	async findByClinic(clinicId: number, id: number): Promise<OwnerRecord | null> {
		const rows = await db
			.select()
			.from(owners)
			.where(and(eq(owners.clinicId, clinicId), eq(owners.id, id)));
		return rows[0] ?? null;
	},

	async createByClinic(clinicId: number, data: { fullName: string; phone?: string; email?: string; address?: string }) {
		const rows = await db
			.insert(owners)
			.values({
				clinicId,
				fullName: data.fullName,
				phone: data.phone,
				email: data.email,
				address: data.address,
			})
			.returning();
		return rows[0];
	},

	async updateByClinic(
		clinicId: number,
		id: number,
		data: { fullName?: string; phone?: string; email?: string; address?: string; status?: boolean },
	): Promise<OwnerRecord | null> {
		const rows = await db
			.update(owners)
			.set({
				fullName: data.fullName,
				phone: data.phone,
				email: data.email,
				address: data.address,
				status: data.status,
			})
			.where(and(eq(owners.clinicId, clinicId), eq(owners.id, id)))
			.returning();
		return rows[0] ?? null;
	},
};

export type OwnersRepository = typeof ownersRepository;
