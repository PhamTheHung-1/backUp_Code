import { AppError } from "@be/shared/errors/app-error";
import { t } from "elysia";
import type { App } from "../../App";
import { clinicContextService } from "../clinic-context/clinic-context.service";
import { petCreateSchema, petListResponseSchema, petSelectSchema, petUpdateSchema } from "./pets.schema";
import { type PetsService, petsService } from "./pets.service";

const COLLECTION_PATH = "/api/pets";
const DETAIL_PATH = "/api/pets/:id";

export function createPetsRoutes(service: PetsService = petsService) {
	return (app: App) =>
		app
			.get(
				"",
				async ({ query, clinicAuth }) => {
					if (!clinicAuth) throw AppError.unauthorized("Unauthenticated");
					const context = clinicContextService.requireClinicContext(clinicAuth);
					clinicContextService.requireEndpointPermission(context, "GET", COLLECTION_PATH);
					return service.listPetsByClinic(context.clinicId, {
						page: query.page ?? 1,
						pageSize: query.pageSize ?? 20,
						search: query.search,
						species: query.species,
						sex: query.sex,
						status: query.status,
					});
				},
				{
					query: t.Object({
						page: t.Optional(t.Numeric({ minimum: 1, multipleOf: 1 })),
						pageSize: t.Optional(t.Numeric({ minimum: 1, maximum: 100, multipleOf: 1 })),
						search: t.Optional(t.String({ maxLength: 100 })),
						species: t.Optional(t.String({ minLength: 1, maxLength: 80 })),
						sex: t.Optional(t.Union([t.Literal("male"), t.Literal("female"), t.Literal("unknown")])),
						status: t.Optional(t.Boolean()),
					}),
					response: petListResponseSchema,
					isAuth: true,
					detail: { summary: "List clinic pets", tags: ["Pet"], authType: 2 },
				},
			)
			.get(
				"/:id",
				async ({ params: { id }, clinicAuth }) => {
					if (!clinicAuth) throw AppError.unauthorized("Unauthenticated");
					const context = clinicContextService.requireClinicContext(clinicAuth);
					clinicContextService.requireEndpointPermission(context, "GET", DETAIL_PATH);
					return service.getPetByClinic(context, id);
				},
				{
					params: t.Object({ id: t.Numeric({ minimum: 1 }) }),
					response: t.Intersect([petSelectSchema, t.Object({ ownerName: t.String(), ownerPhone: t.Union([t.String(), t.Null()]), })]),
					isAuth: true,
					detail: { summary: "Get clinic pet", tags: ["Pet"], authType: 2 },
				},
			)
			.post(
				"",
				async ({ body, clinicAuth }) => {
					if (!clinicAuth) throw AppError.unauthorized("Unauthenticated");
					const context = clinicContextService.requireClinicContext(clinicAuth);
					clinicContextService.requireEndpointPermission(context, "POST", COLLECTION_PATH);
					return service.createPet(context, body);
				},
				{
					body: petCreateSchema,
					response: t.Intersect([petSelectSchema, t.Object({ ownerName: t.String(), ownerPhone: t.Union([t.String(), t.Null()]), })]),
					isAuth: true,
					detail: { summary: "Create clinic pet", tags: ["Pet"], authType: 2 },
				},
			)
			.patch(
				"/:id",
				async ({ params: { id }, body, clinicAuth }) => {
					if (!clinicAuth) throw AppError.unauthorized("Unauthenticated");
					const context = clinicContextService.requireClinicContext(clinicAuth);
					clinicContextService.requireEndpointPermission(context, "PATCH", DETAIL_PATH);
					return service.updatePet(context, id, body);
				},
				{
					params: t.Object({ id: t.Numeric({ minimum: 1 }) }),
					body: petUpdateSchema,
					response: t.Intersect([petSelectSchema, t.Object({ ownerName: t.String(), ownerPhone: t.Union([t.String(), t.Null()]), })]),
					isAuth: true,
					detail: { summary: "Update clinic pet", tags: ["Pet"], authType: 2 },
				},
			);
}

export default createPetsRoutes();
