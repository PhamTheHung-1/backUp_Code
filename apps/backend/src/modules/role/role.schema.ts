import { roles } from "@be/db/schema/role-schema";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";

export const selectRoleSchema = createSelectSchema(roles);
export type Role = typeof selectRoleSchema.static;

export const insertRoleSchema = createInsertSchema(roles);
export type InsertRole = typeof insertRoleSchema.static;

export { roles };
