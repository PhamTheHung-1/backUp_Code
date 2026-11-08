import { AppError } from "@be/shared/errors/app-error";
import { t } from "elysia";
import type { App } from "../../App";
import { authService } from "../auth/auth.service";
import { clinicContextService } from "../clinic-context/clinic-context.service";
import { changePasswordSchema, createUserSchema, safeSelectUserSchema, updateUserSchema } from "./user.schema";
import { userService } from "./user.service";

export default (app: App) =>
	app
		.get(
			"/:id",
			async ({ params: { id }, status }) => {
				try {
					return await userService.getUserById(id);
				} catch (err: unknown) {
					if (err instanceof AppError) {
						return status(404, err.message);
					}
					throw err;
				}
			},
			{
				params: t.Object({
					id: t.Numeric(),
				}),
				response: {
					200: safeSelectUserSchema,
					404: t.String(),
				},
				detail: {
					summary: "Get user detail by ID",
					tags: ["User"],
					authType: 1,
				},
			},
		)
		.post(
			"",
			async ({ body }) => {
				return userService.createUser(body);
			},
			{
				body: createUserSchema,
				detail: {
					summary: "Create a new user",
					tags: ["User"],
					authType: 1,
				},
			},
		)
		.post(
			"/change-password",
			async ({ body, clinicAuth }) => {
				if (!clinicAuth) throw AppError.unauthorized("Unauthenticated");
				clinicContextService.requireClinicContext(clinicAuth);
				return authService.changePasswordByEmail(clinicAuth.user.email, body.oldPassword, body.newPassword);
			},
			{
				body: changePasswordSchema,
				isAuth: true,
				detail: {
					summary: "Change password for authenticated user",
					tags: ["User"],
					authType: 1,
				},
			},
		)
		.put(
			"",
			async ({ body, status }) => {
				try {
					return await userService.updateUser(body);
				} catch (err: unknown) {
					if (err instanceof AppError) {
						return status(404, err.message);
					}
					throw err;
				}
			},
			{
				body: updateUserSchema,
				detail: {
					summary: "Update user",
					tags: ["User"],
					authType: 1,
				},
			},
		)
		.delete(
			"/:id",
			async ({ params: { id } }) => {
				return userService.deleteUser(id);
			},
			{
				params: t.Object({
					id: t.Numeric(),
				}),
				detail: {
					summary: "Delete user",
					tags: ["User"],
					authType: 1,
				},
			},
		)
		.get(
			"",
			async () => {
				return userService.listUsers();
			},
			{
				response: t.Array(safeSelectUserSchema),
				detail: {
					summary: "Return user list",
					tags: ["User"],
					authType: 2,
				},
			},
		);
