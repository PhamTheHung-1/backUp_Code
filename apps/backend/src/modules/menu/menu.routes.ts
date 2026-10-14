import { withNumericId } from "@be/db/schema/schema-utils";
import { t } from "elysia";
import type { App } from "../../App";
import { insertMenuSchema, selectMenuSchema } from "./menu.schema";
import { menuService } from "./menu.service";

export default (app: App) =>
	app
		.post(
			"",
			async ({ body }) => {
				return menuService.createMenu(body);
			},
			{
				body: insertMenuSchema,
				detail: {
					summary: "Create new Menu",
					tags: ["Menu"],
					authType: 2,
				},
			},
		)
		.put(
			"",
			async ({ body }) => {
				return menuService.updateMenu(body);
			},
			{
				body: withNumericId(insertMenuSchema),
				detail: {
					summary: "Update Menu",
					tags: ["Menu"],
					authType: 2,
				},
			},
		)
		.delete(
			"/:id",
			async ({ params: { id } }) => {
				return menuService.deleteMenu(id);
			},
			{
				params: t.Object({
					id: t.Numeric(),
				}),
				detail: {
					summary: "Delete Menu",
					tags: ["Menu"],
					authType: 2,
				},
			},
		)
		.get(
			"list",
			async () => {
				return menuService.listMenus();
			},
			{
				response: t.Array(selectMenuSchema),
				detail: {
					summary: "Retun menus list",
					tags: ["Menu"],
					authType: 0,
				},
			},
		);
