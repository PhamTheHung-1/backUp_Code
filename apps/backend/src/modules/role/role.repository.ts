import { db } from "@be/db";
import { and, eq, inArray } from "drizzle-orm";
import { type InsertRole, roles } from "./role.schema";

export const roleRepository = {
	async findAll() {
		return db.select().from(roles);
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

	// biome-ignore lint/suspicious/noExplicitAny: dynamic update object
	async update(id: number, data: Record<string, any>) {
		return db.update(roles).set(data).where(eq(roles.id, id));
	},
};

export type RoleRepository = typeof roleRepository;
