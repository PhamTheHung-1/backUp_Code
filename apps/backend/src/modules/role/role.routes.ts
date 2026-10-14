import { withNumericId } from "@be/db/schema/schema-utils";
import { t } from "elysia";
import type { App } from "../../App";
import { insertRoleSchema, selectRoleSchema } from "./role.schema";
import { roleService } from "./role.service";

export default (app: App) =>
	app
		.post(
			"",
			async ({ body }) => {
				return roleService.createRole(body);
			},
			{
				body: insertRoleSchema,
				detail: {
					summary: "Create a new role",
					tags: ["Role"],
					authType: 2,
				},
			},
		)
		.put(
			"",
			async ({ body }) => {
				return roleService.updateRole(body);
			},
			{
				body: withNumericId(insertRoleSchema),
				detail: {
					summary: "Update role",
					tags: ["Role"],
					authType: 2,
				},
			},
		)
		.get(
			"",
			async () => {
				return roleService.listRoles();
			},
			{
				response: t.Array(selectRoleSchema),
				detail: {
					summary: "Return role list",
					tags: ["Role"],
					authType: 0,
				},
			},
		);
