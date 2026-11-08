import { AppError } from "@be/shared/errors/app-error";
import type { ClinicContextRepository, ClinicMembershipRecord } from "./clinic-context.repository";
import { clinicContextRepository } from "./clinic-context.repository";

export type ClinicContext = {
	clinicId: number;
	membershipId: number;
	branchScope: "all" | "assigned";
	branchIds: number[];
	roleIds: number[];
	permissions: number[];
};

export type AvailableClinic = {
	id: number;
	name: string;
};

export type RequestClinicContext = {
	user: {
		id: number;
		email: string;
	};
	clinicContext: ClinicContext | null;
	availableClinics: AvailableClinic[];
};

export type ExistingJWTVerifier = {
	verify(token: string): Promise<{ username: string | null } | boolean | false>;
};

function isActiveMembership(membership: ClinicMembershipRecord) {
	return membership.membershipStatus === "active" && membership.clinicStatus;
}

export function createClinicContextService(repo: ClinicContextRepository = clinicContextRepository) {
	return {
		async authenticateRequest(
			authorization: string | undefined,
			jwt: ExistingJWTVerifier | undefined,
			requestedClinicId?: string,
			allowClinicSelection = false,
		): Promise<RequestClinicContext> {
			const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : null;
			if (!token || !jwt) throw AppError.unauthorized("Unauthenticated");

			const userinfo = await jwt.verify(token);
			if (!userinfo || typeof userinfo === "boolean" || !userinfo.username) {
				throw AppError.unauthorized("Unauthenticated");
			}

			return this.resolveRequest(userinfo.username, requestedClinicId, allowClinicSelection);
		},

		async resolveRequest(email: string, requestedClinicId?: string, allowClinicSelection = false): Promise<RequestClinicContext> {
			const user = await repo.findUserByEmail(email);
			if (!user || user.status === false) {
				throw AppError.unauthorized("Unauthenticated");
			}

			const memberships = await repo.findMembershipsByUserId(user.id);
			const availableMemberships = memberships.filter(isActiveMembership);
			if (availableMemberships.length === 0) {
				throw AppError.forbidden("Active clinic membership required");
			}

			const availableClinics = availableMemberships.map(({ clinicId, clinicName }) => ({
				id: clinicId,
				name: clinicName,
			}));

			let selectedClinicId: number | undefined;
			if (requestedClinicId !== undefined) {
				if (!/^[1-9]\d*$/.test(requestedClinicId)) {
					throw AppError.badRequest("X-Clinic-Id must be a positive integer");
				}
				selectedClinicId = Number(requestedClinicId);
				if (!Number.isSafeInteger(selectedClinicId)) {
					throw AppError.badRequest("X-Clinic-Id must be a positive integer");
				}
			} else if (availableMemberships.length === 1) {
				selectedClinicId = availableMemberships[0].clinicId;
			} else if (!allowClinicSelection) {
				throw AppError.badRequest("X-Clinic-Id is required when the user belongs to multiple clinics");
			}

			const membership = selectedClinicId === undefined ? undefined : availableMemberships.find(item => item.clinicId === selectedClinicId);
			if (selectedClinicId !== undefined && !membership) {
				throw AppError.forbidden("Active clinic membership required");
			}

			const clinicContext: ClinicContext | null = membership
				? {
						clinicId: membership.clinicId,
						membershipId: membership.membershipId,
						branchScope: membership.branchScope === "all" ? "all" : "assigned",
						branchIds: membership.branchScope === "all" ? [] : await repo.findMembershipBranchIds(membership.clinicId, membership.membershipId),
						roleIds: membership.roleIds,
						permissions: membership.permissions,
					}
				: null;

			return {
				user: { id: user.id, email },
				clinicContext,
				availableClinics,
			};
		},

		requireClinicContext(context: RequestClinicContext): ClinicContext {
			if (!context.clinicContext) {
				throw AppError.badRequest("Select an active clinic using X-Clinic-Id");
			}
			return context.clinicContext;
		},

		requirePermission(context: ClinicContext, permissionHash: string) {
			if (!/^\d+$/.test(permissionHash)) {
				throw AppError.forbidden("Permission denied");
			}
			const permissionId = Number(permissionHash);
			if (!Number.isSafeInteger(permissionId) || !context.permissions.includes(permissionId)) {
				throw AppError.forbidden("Permission denied");
			}
		},

		requireEndpointPermission(context: ClinicContext, method: string, path: string) {
			const permissionId = Bun.hash.xxHash32(`${method}-${path}`);
			this.requirePermission(context, String(permissionId));
		},

		assertResourceClinic(context: ClinicContext, resourceClinicId: number) {
			if (context.clinicId !== resourceClinicId) {
				throw AppError.notFound("Resource not found");
			}
		},

		async requireBranchAccess(context: ClinicContext, branchId: number, operation: "read" | "write") {
			const branch = await repo.findBranchById(branchId);
			if (branch === null || branch.clinicId !== context.clinicId) {
				throw AppError.notFound("Branch not found");
			}
			if (operation === "write" && !branch.status) {
				throw AppError.forbidden("Branch is inactive");
			}

			if (operation === "write" && context.branchScope === "assigned" && !context.branchIds.includes(branchId)) {
				throw AppError.forbidden("Branch access denied");
			}
		},
	};
}

export const clinicContextService = createClinicContextService();
