import { AppError } from "@be/shared/errors/app-error";
import type { App } from "../../App";
import { loginBodySchema, loginResponseSchema } from "./auth.schema";
import { authService } from "./auth.service";

export default (app: App) =>
	app.post(
		"",
		async ({ body, status, jwt }) => {
			try {
				const result = await authService.login(body, jwt);
				return result;
			} catch (err: unknown) {
				if (err instanceof AppError) {
					return status(401, err.message);
				}
				throw err;
			}
		},
		{
			body: loginBodySchema,
			response: loginResponseSchema,
			detail: {
				summary: "Login",
				tags: ["User"],
				authType: 0,
			},
		},
	);
