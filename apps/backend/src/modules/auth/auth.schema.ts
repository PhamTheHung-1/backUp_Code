import { selectMenuSchema } from "@be/modules/menu/menu.schema";
import { t } from "elysia";

export const loginBodySchema = t.Object({
	username: t.String(),
	password: t.String(),
});
export type LoginBody = typeof loginBodySchema.static;

export const loginResponseUserSchema = t.Object({
	id: t.Number(),
	email: t.Nullable(t.String()),
	username: t.Nullable(t.String()),
	avatar: t.Nullable(t.String()),
	status: t.Nullable(t.Boolean()),
	roles: t.Nullable(t.Array(t.Number())),
	menus: t.Array(selectMenuSchema),
});

export const loginResponseSchema = {
	200: t.Object({
		user: loginResponseUserSchema,
		token: t.Nullable(t.String()),
	}),
	401: t.String(),
};
