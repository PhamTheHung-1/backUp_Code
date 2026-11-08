import { db } from "@be/db";
import { and, eq, inArray } from "drizzle-orm";
import { type InsertRole, roles } from "./role.schema";

export const roleRepository = {
	async findAllByClinicId(clinicId: number) {
		return db.select().from(roles).where(eq(roles.clinicId, clinicId));
	},

	async findByIds(roleIds: number[]) {
		if (!roleIds.length) return [];
		return db
			.select()
			.from(roles)
			.where(and(inArray(roles.id, roleIds), eq(roles.status, true)));
	},

	async findActivatedRoleApis() {
		return db.select({ id: roles.id, apis: roles.apis }).from(roles);
	},

	async create(data: InsertRole) {
		return db.insert(roles).values(data).returning({ id: roles.id });
	},

	async updateInClinic(id: number, clinicId: number, data: Partial<Omit<InsertRole, "clinicId">>) {
		return db
			.update(roles)
			.set(data)
			.where(and(eq(roles.id, id), eq(roles.clinicId, clinicId)))
			.returning({ id: roles.id });
	},
};

export type RoleRepository = typeof roleRepository;
