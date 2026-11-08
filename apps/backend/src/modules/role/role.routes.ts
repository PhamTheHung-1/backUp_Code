import { withNumericId } from "@be/db/schema/schema-utils";
import { AppError } from "@be/shared/errors/app-error";
import { t } from "elysia";
import type { App } from "../../App";
import { clinicContextService } from "../clinic-context/clinic-context.service";
import { insertRoleSchema, selectRoleSchema } from "./role.schema";
import { roleService } from "./role.service";

export default (app: App) =>
	app
		.post(
			"",
			async ({ body, clinicAuth }) => {
				if (!clinicAuth) throw AppError.unauthorized("Unauthenticated");
				const clinicContext = clinicContextService.requireClinicContext(clinicAuth);
				return roleService.createRole(body, clinicContext.clinicId);
			},
			{
				body: t.Omit(insertRoleSchema, ["clinicId"]),
				isAuth: true,
				detail: {
					summary: "Create a new role",
					tags: ["Role"],
					authType: 2,
				},
			},
		)
		.put(
			"",
			async ({ body, clinicAuth }) => {
				if (!clinicAuth) throw AppError.unauthorized("Unauthenticated");
				const clinicContext = clinicContextService.requireClinicContext(clinicAuth);
				return roleService.updateRole(body, clinicContext.clinicId);
			},
			{
				body: withNumericId(t.Omit(insertRoleSchema, ["clinicId"])),
				isAuth: true,
				detail: {
					summary: "Update role",
					tags: ["Role"],
					authType: 2,
				},
			},
		)
		.get(
			"",
			async ({ clinicAuth }) => {
				if (!clinicAuth) throw AppError.unauthorized("Unauthenticated");
				const clinicContext = clinicContextService.requireClinicContext(clinicAuth);
				return roleService.listRoles(clinicContext.clinicId);
			},
			{
				response: t.Array(selectRoleSchema),
				isAuth: true,
				detail: {
					summary: "Return role list",
					tags: ["Role"],
					authType: 2,
				},
			},
		);
