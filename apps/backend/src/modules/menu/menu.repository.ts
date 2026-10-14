import { db } from "@be/db";
import { and, eq, inArray } from "drizzle-orm";
import { type InsertMenu, menus } from "./menu.schema";

export const menuRepository = {
	async findAll() {
		return db.select().from(menus);
	},

	async findByIds(menuIds: number[]) {
		if (!menuIds.length) return [];
		return db
			.select()
			.from(menus)
			.where(and(inArray(menus.id, menuIds), eq(menus.active, true)));
	},

	async create(data: InsertMenu) {
		return db.insert(menus).values(data).returning({ id: menus.id });
	},

	// biome-ignore lint/suspicious/noExplicitAny: dynamic update object
	async update(id: number, data: Record<string, any>) {
		return db.update(menus).set(data).where(eq(menus.id, id)).returning({ id: menus.id });
	},

	async delete(id: number) {
		return db.delete(menus).where(eq(menus.id, id));
	},
};

export type MenuRepository = typeof menuRepository;
