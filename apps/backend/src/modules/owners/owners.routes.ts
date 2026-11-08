import { AppError } from "@be/shared/errors/app-error";
import { t } from "elysia";
import type { App } from "../../App";
import { clinicContextService } from "../clinic-context/clinic-context.service";
import { ownerCreateSchema, ownerListResponseSchema, ownerSelectSchema, ownerUpdateSchema } from "./owners.schema";
import { type OwnersService, ownersService } from "./owners.service";

const COLLECTION_PATH = "/api/owners";
const DETAIL_PATH = "/api/owners/:id";

export function createOwnersRoutes(service: OwnersService = ownersService) {
	return (app: App) =>
		app
			.get(
				"",
				async ({ query, clinicAuth }) => {
					if (!clinicAuth) throw AppError.unauthorized("Unauthenticated");
					const context = clinicContextService.requireClinicContext(clinicAuth);
					clinicContextService.requireEndpointPermission(context, "GET", COLLECTION_PATH);
					return service.listOwnersByClinic(context.clinicId, {
						page: query.page ?? 1,
						pageSize: query.pageSize ?? 20,
						search: query.search,
						status: query.status,
					});
				},
				{
					query: t.Object({
						page: t.Optional(t.Numeric({ minimum: 1, multipleOf: 1 })),
						pageSize: t.Optional(t.Numeric({ minimum: 1, maximum: 100, multipleOf: 1 })),
						search: t.Optional(t.String({ maxLength: 100 })),
						status: t.Optional(t.Boolean()),
					}),
					response: ownerListResponseSchema,
					isAuth: true,
					detail: { summary: "List clinic owners", tags: ["Owner"], authType: 2 },
				},
			)
			.get(
				"/:id",
				async ({ params: { id }, clinicAuth }) => {
					if (!clinicAuth) throw AppError.unauthorized("Unauthenticated");
					const context = clinicContextService.requireClinicContext(clinicAuth);
					clinicContextService.requireEndpointPermission(context, "GET", DETAIL_PATH);
					return service.getOwnerByClinic(context, id);
				},
				{
					params: t.Object({ id: t.Numeric({ minimum: 1 }) }),
					response: ownerSelectSchema,
					isAuth: true,
					detail: { summary: "Get clinic owner", tags: ["Owner"], authType: 2 },
				},
			)
			.post(
				"",
				async ({ body, clinicAuth }) => {
					if (!clinicAuth) throw AppError.unauthorized("Unauthenticated");
					const context = clinicContextService.requireClinicContext(clinicAuth);
					clinicContextService.requireEndpointPermission(context, "POST", COLLECTION_PATH);
					return service.createOwner(context, body);
				},
				{
					body: ownerCreateSchema,
					response: ownerSelectSchema,
					isAuth: true,
					detail: { summary: "Create clinic owner", tags: ["Owner"], authType: 2 },
				},
			)
			.patch(
				"/:id",
				async ({ params: { id }, body, clinicAuth }) => {
					if (!clinicAuth) throw AppError.unauthorized("Unauthenticated");
					const context = clinicContextService.requireClinicContext(clinicAuth);
					clinicContextService.requireEndpointPermission(context, "PATCH", DETAIL_PATH);
					return service.updateOwner(context, id, body);
				},
				{
					params: t.Object({ id: t.Numeric({ minimum: 1 }) }),
					body: ownerUpdateSchema,
					response: ownerSelectSchema,
					isAuth: true,
					detail: { summary: "Update clinic owner", tags: ["Owner"], authType: 2 },
				},
			);
}

export default createOwnersRoutes();
