import { AppError } from "@be/shared/errors/app-error";
import { t } from "elysia";
import type { App } from "../../App";
import { clinicContextService } from "../clinic-context/clinic-context.service";
import {
	staffAccountUpdateSchema,
	staffCreateSchema,
	staffJobTitleCreateSchema,
	staffJobTitleUpdateSchema,
	staffLinkUserSchema,
	staffListQuerySchema,
	staffListResponseSchema,
	staffMembershipStatusSchema,
	staffProfileSchema,
	staffProfileStatusSchema,
	staffRolesSchema,
	staffUpdateSchema,
} from "./staff.schema";
import { type StaffService, staffService } from "./staff.service";

const COLLECTION_PATH = "/api/staff";
const DETAIL_PATH = "/api/staff/:membershipId";
const JOB_TITLES_PATH = "/api/staff/job-titles";
const JOB_TITLE_DETAIL_PATH = "/api/staff/job-titles/:id";

type ClinicAuth = NonNullable<Parameters<typeof clinicContextService.requireClinicContext>[0]>;

function requirePermission(clinicAuth: ClinicAuth | null, method: string, path: string) {
	if (!clinicAuth) throw AppError.unauthorized("Unauthenticated");
	const context = clinicContextService.requireClinicContext(clinicAuth);
	clinicContextService.requireEndpointPermission(context, method, path);
	return context;
}

export function createStaffRoutes(service: StaffService = staffService) {
	return (app: App) =>
		app
			.get(
				"/job-titles",
				async ({ query, clinicAuth }) => {
					const context = requirePermission(clinicAuth, "GET", JOB_TITLES_PATH);
					return service.listJobTitles(context.clinicId, query.status);
				},
				{
					query: t.Object({ status: t.Optional(t.Boolean()) }),
					isAuth: true,
					detail: { summary: "List clinic staff job titles", tags: ["Staff"], authType: 2 },
				},
			)
			.post(
				"/job-titles",
				async ({ body, clinicAuth }) => {
					const context = requirePermission(clinicAuth, "POST", JOB_TITLES_PATH);
					return service.createJobTitle(context.clinicId, body);
				},
				{
					body: staffJobTitleCreateSchema,
					isAuth: true,
					detail: { summary: "Create a clinic staff job title", tags: ["Staff"], authType: 2 },
				},
			)
			.patch(
				"/job-titles/:id",
				async ({ params: { id }, body, clinicAuth }) => {
					const context = requirePermission(clinicAuth, "PATCH", JOB_TITLE_DETAIL_PATH);
					return service.updateJobTitle(context.clinicId, id, body);
				},
				{
					params: t.Object({ id: t.Numeric({ minimum: 1 }) }),
					body: staffJobTitleUpdateSchema,
					isAuth: true,
					detail: { summary: "Update a clinic staff job title", tags: ["Staff"], authType: 2 },
				},
			)
			.get(
				"",
				async ({ query, clinicAuth }) => {
					const context = requirePermission(clinicAuth, "GET", COLLECTION_PATH);
					return service.listStaffByClinic(context.clinicId, {
						page: query.page ?? 1,
						pageSize: query.pageSize ?? 20,
						search: query.search,
						jobTitleId: query.jobTitleId,
						employmentStatus: query.employmentStatus,
						membershipStatus: query.membershipStatus,
						roleId: query.roleId,
						userStatus: query.userStatus,
						sortBy: query.sortBy,
						sortOrder: query.sortOrder,
					});
				},
				{
					query: staffListQuerySchema,
					response: staffListResponseSchema,
					isAuth: true,
					detail: { summary: "List clinic staff", tags: ["Staff"], authType: 2 },
				},
			)
			.post(
				"",
				async ({ body, clinicAuth }) => {
					if (!clinicAuth) throw AppError.unauthorized("Unauthenticated");
					const context = requirePermission(clinicAuth, "POST", COLLECTION_PATH);
					return service.createStaff(context, clinicAuth.user.id, body);
				},
				{
					body: staffCreateSchema,
					response: staffProfileSchema,
					isAuth: true,
					detail: { summary: "Create a clinic staff member", tags: ["Staff"], authType: 2 },
				},
			)
			.get(
				"/:membershipId",
				async ({ params: { membershipId }, clinicAuth }) => {
					const context = requirePermission(clinicAuth, "GET", DETAIL_PATH);
					return service.getStaffByClinic(context, membershipId);
				},
				{
					params: t.Object({ membershipId: t.Numeric({ minimum: 1 }) }),
					response: staffProfileSchema,
					isAuth: true,
					detail: { summary: "Get clinic staff detail", tags: ["Staff"], authType: 2 },
				},
			)
			.patch(
				"/:membershipId",
				async ({ params: { membershipId }, body, clinicAuth }) => {
					const context = requirePermission(clinicAuth, "PATCH", DETAIL_PATH);
					return service.updateStaff(context, membershipId, body);
				},
				{
					params: t.Object({ membershipId: t.Numeric({ minimum: 1 }) }),
					body: staffUpdateSchema,
					response: staffProfileSchema,
					isAuth: true,
					detail: { summary: "Update clinic staff profile", tags: ["Staff"], authType: 2 },
				},
			)
			.patch(
				"/:membershipId/profile-status",
				async ({ params: { membershipId }, body, clinicAuth }) => {
					const context = requirePermission(clinicAuth, "PATCH", "/api/staff/:membershipId/profile-status");
					return service.updateProfileStatus(context, membershipId, body);
				},
				{
					params: t.Object({ membershipId: t.Numeric({ minimum: 1 }) }),
					body: staffProfileStatusSchema,
					response: staffProfileSchema,
					isAuth: true,
					detail: { summary: "Update staff employment status", tags: ["Staff"], authType: 2 },
				},
			)
			.patch(
				"/:membershipId/membership-status",
				async ({ params: { membershipId }, body, clinicAuth }) => {
					const context = requirePermission(clinicAuth, "PATCH", "/api/staff/:membershipId/membership-status");
					return service.updateMembershipStatus(context, membershipId, body.status);
				},
				{
					params: t.Object({ membershipId: t.Numeric({ minimum: 1 }) }),
					body: staffMembershipStatusSchema,
					response: staffProfileSchema,
					isAuth: true,
					detail: { summary: "Update staff clinic membership status", tags: ["Staff"], authType: 2 },
				},
			)
			.post(
				"/:membershipId/link-user",
				async ({ params: { membershipId }, body, clinicAuth }) => {
					const context = requirePermission(clinicAuth, "POST", "/api/staff/:membershipId/link-user");
					return service.linkUser(context, membershipId, body.existingUserId);
				},
				{
					params: t.Object({ membershipId: t.Numeric({ minimum: 1 }) }),
					body: staffLinkUserSchema,
					response: staffProfileSchema,
					isAuth: true,
					detail: { summary: "Link an existing User to staff membership", tags: ["Staff"], authType: 2 },
				},
			)
			.patch(
				"/:membershipId/account",
				async ({ params: { membershipId }, body, clinicAuth }) => {
					const context = requirePermission(clinicAuth, "PATCH", "/api/staff/:membershipId/account");
					return service.updateAccount(context, membershipId, body);
				},
				{
					params: t.Object({ membershipId: t.Numeric({ minimum: 1 }) }),
					body: staffAccountUpdateSchema,
					response: staffProfileSchema,
					isAuth: true,
					detail: { summary: "Update staff user account fields", tags: ["Staff"], authType: 2 },
				},
			)
			.put(
				"/:membershipId/roles",
				async ({ params: { membershipId }, body, clinicAuth }) => {
					const context = requirePermission(clinicAuth, "PUT", "/api/staff/:membershipId/roles");
					return service.replaceRoles(context, membershipId, body.roleIds);
				},
				{
					params: t.Object({ membershipId: t.Numeric({ minimum: 1 }) }),
					body: staffRolesSchema,
					response: staffProfileSchema,
					isAuth: true,
					detail: { summary: "Replace staff clinic roles", tags: ["Staff"], authType: 2 },
				},
			);
}

export default createStaffRoutes();
