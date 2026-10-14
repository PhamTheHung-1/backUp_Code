import { menus } from "@be/db/schema/menu-schema";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";

export const selectMenuSchema = createSelectSchema(menus);
export type Menu = typeof selectMenuSchema.static;

export const insertMenuSchema = createInsertSchema(menus);
export type InsertMenu = typeof insertMenuSchema.static;

export { menus };
