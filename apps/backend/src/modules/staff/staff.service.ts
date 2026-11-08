import { AppError } from "@be/shared/errors/app-error";
import type { ClinicContext } from "../clinic-context/clinic-context.service";
import type { StaffCreate, StaffUpdate } from "./staff.schema";
import { type StaffListQuery, type StaffRepository, staffRepository } from "./staff.repository";

type EmploymentStatus = "active" | "on_leave" | "terminated";
type MembershipStatus = "invited" | "active" | "suspended" | "removed";

function isValidDate(value: string) {
	return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function validateDates(startedAt?: string | null, endedAt?: string | null) {
	if (startedAt && !isValidDate(startedAt)) throw AppError.badRequest("Invalid startedAt date");
	if (endedAt && !isValidDate(endedAt)) throw AppError.badRequest("Invalid endedAt date");
	if (startedAt && endedAt && endedAt < startedAt) throw AppError.badRequest("endedAt must be greater than or equal to startedAt");
}

function postgresErrorCode(error: unknown) {
	if (typeof error === "object" && error !== null && "code" in error) return String(error.code);
	return "";
}

function normalizeJobTitle(row: {
	id: number;
	clinicId: number;
	code: string;
	name: string;
	status: boolean;
	createdAt: Date | string | null;
	updatedAt: Date | string | null;
}) {
	return {
		...row,
		createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : (row.createdAt ?? null),
		updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : (row.updatedAt ?? null),
	};
}

export function createStaffService(repo: StaffRepository = staffRepository) {
	return {
		listStaffByClinic(clinicId: number, query: StaffListQuery) {
			return repo.listByClinic(clinicId, query);
		},

		async getStaffByClinic(context: ClinicContext, membershipId: number) {
			const staff = await repo.findByClinic(context.clinicId, membershipId);
			if (!staff) throw AppError.notFound("Staff not found");
			return staff;
	},

		async createStaff(context: ClinicContext, invitedBy: number, data: StaffCreate) {
			if (!data.user && data.existingUserId === undefined) {
				throw AppError.badRequest("Either user or existingUserId is required");
			}
			if (data.user && data.existingUserId !== undefined) {
				throw AppError.badRequest("Cannot provide user and existingUserId together");
			}

			validateDates(data.profile.startedAt ?? null, data.profile.endedAt ?? null);
			if (await repo.findStaffCodeByClinic(context.clinicId, data.profile.staffCode)) {
				throw AppError.badRequest("Staff code already exists");
			}

			if (data.profile.jobTitleId !== undefined && data.profile.jobTitleId !== null) {
				const title = await repo.findJobTitleByClinic(context.clinicId, data.profile.jobTitleId);
				if (!title || !title.status) throw AppError.notFound("Job title not found");
			}

			const roleIds = data.membership.roleIds ?? [];
			for (const roleId of new Set(roleIds)) {
				const role = await repo.findActiveRoleByClinic(context.clinicId, roleId);
				if (!role) throw AppError.notFound("Role not found in clinic");
			}

			let existingUser: Awaited<ReturnType<StaffRepository["findUserById"]>> = null;
			if (data.existingUserId !== undefined) {
				existingUser = await repo.findUserById(data.existingUserId);
				if (!existingUser || existingUser.status === false) throw AppError.notFound("Active user not found");
			}
			if (data.user) {
				const emailUser = await repo.findUserByEmail(data.user.email.trim());
				if (emailUser) throw AppError.badRequest("Email already exists");
			}

			const linkedUserId = data.existingUserId ?? existingUser?.id;
			if (linkedUserId !== undefined) {
				const membership = await repo.findMembershipByUserAndClinic(context.clinicId, linkedUserId);
				if (membership) throw AppError.badRequest("User already belongs to this clinic");
			}

			try {
				const created = await repo.createStaff(context.clinicId, invitedBy, {
					profile: {
						staffCode: data.profile.staffCode.trim(),
						fullName: data.profile.fullName.trim(),
						phone: data.profile.phone ?? null,
						dateOfBirth: data.profile.dateOfBirth ?? null,
						gender: data.profile.gender ?? null,
						address: data.profile.address ?? null,
						jobTitleId: data.profile.jobTitleId ?? null,
						specialties: data.profile.specialties ?? [],
						employmentStatus: data.profile.employmentStatus ?? "active",
						startedAt: data.profile.startedAt ?? null,
						endedAt: data.profile.endedAt ?? null,
						note: data.profile.note ?? null,
					},
					existingUserId: data.existingUserId,
					newUser: data.user
						? { email: data.user.email, username: data.user.username, password: data.user.password, status: data.user.status }
						: undefined,
					membershipStatus: data.membership.status ?? "active",
					branchScope: data.membership.branchScope ?? "all",
					roleIds,
				});
				const staff = await repo.findByClinic(context.clinicId, created.membershipId);
				if (!staff) throw new Error("Created staff could not be loaded");
				return staff;
			} catch (error) {
				if (error instanceof Error && error.message === "USER_ALREADY_IN_CLINIC") {
					throw AppError.badRequest("User already belongs to this clinic");
				}
				if (postgresErrorCode(error) === "23505") {
					throw AppError.badRequest("Staff code, email, or clinic membership already exists");
				}
				throw error;
			}
		},

		async updateStaff(context: ClinicContext, membershipId: number, data: StaffUpdate) {
			if (Object.keys(data).length === 0) throw AppError.badRequest("At least one staff field is required");
			const current = await repo.findByClinic(context.clinicId, membershipId);
			if (!current) throw AppError.notFound("Staff not found");
			validateDates(data.startedAt, data.endedAt);

			if (data.staffCode !== undefined) {
				const duplicate = await repo.findStaffCodeByClinic(context.clinicId, data.staffCode, membershipId);
				if (duplicate) throw AppError.badRequest("Staff code already exists");
			}
			if (data.jobTitleId !== undefined && data.jobTitleId !== null) {
				const title = await repo.findJobTitleByClinic(context.clinicId, data.jobTitleId);
				if (!title || !title.status) throw AppError.notFound("Job title not found");
			}

			const updated = await repo.updateProfileByClinic(context.clinicId, membershipId, {
				staffCode: data.staffCode?.trim(),
				fullName: data.fullName?.trim(),
				phone: data.phone,
				dateOfBirth: data.dateOfBirth,
				gender: data.gender,
				address: data.address,
				jobTitleId: data.jobTitleId,
				specialties: data.specialties,
				startedAt: data.startedAt,
				endedAt: data.endedAt,
				note: data.note,
			});
			if (!updated) throw AppError.notFound("Staff not found");
			const result = await repo.findByClinic(context.clinicId, membershipId);
			if (!result) throw AppError.notFound("Staff not found");
			return result;
		},

		async updateProfileStatus(
			context: ClinicContext,
			membershipId: number,
			data: { employmentStatus: EmploymentStatus; endedAt?: string | null; note?: string | null },
		) {
			const current = await repo.findByClinic(context.clinicId, membershipId);
			if (!current) throw AppError.notFound("Staff not found");

			if (data.employmentStatus === "active") {
				if (current.employmentStatus === "terminated") throw AppError.badRequest("Terminated staff cannot be reactivated through profile status");
			}
			if (data.employmentStatus === "on_leave" && current.employmentStatus === "terminated") {
				throw AppError.badRequest("Terminated staff cannot return to leave");
			}
			if (data.employmentStatus === "terminated") {
				const endedAt = data.endedAt ?? new Date().toISOString().slice(0, 10);
				validateDates(current.startedAt, endedAt);
				await repo.updateProfileByClinic(context.clinicId, membershipId, {
					employmentStatus: "terminated",
					endedAt,
					note: data.note,
				});
			} else {
				if (data.endedAt !== undefined && data.endedAt !== null) {
					throw AppError.badRequest("endedAt must be null for active or on_leave status");
				}
				await repo.updateProfileByClinic(context.clinicId, membershipId, {
					employmentStatus: data.employmentStatus,
					endedAt: null,
					note: data.note,
				});
			}
			const result = await repo.findByClinic(context.clinicId, membershipId);
			if (!result) throw AppError.notFound("Staff not found");
			return result;
		},

		async updateMembershipStatus(
			context: ClinicContext,
			membershipId: number,
			status: MembershipStatus,
		) {
			const membership = await repo.findMembershipByClinic(context.clinicId, membershipId);
			if (!membership) throw AppError.notFound("Staff not found");
			const current = membership.status as MembershipStatus;
			const allowed =
				(current === "invited" && ["active", "removed"].includes(status)) ||
				(current === "active" && ["suspended", "removed"].includes(status)) ||
				(current === "suspended" && ["active", "removed"].includes(status));
			if (!allowed) throw AppError.badRequest("Invalid membership status transition");
			if (membershipId === context.membershipId && status !== current) {
				throw AppError.badRequest("Cannot change the current user's membership");
			}
			const updated = await repo.updateMembershipStatus(context.clinicId, membershipId, status);
			if (!updated) throw AppError.notFound("Staff not found");
			const result = await repo.findByClinic(context.clinicId, membershipId);
			if (!result) throw AppError.notFound("Staff not found");
			return result;
		},

		async linkUser(context: ClinicContext, membershipId: number, existingUserId: number) {
			const membership = await repo.findMembershipByClinic(context.clinicId, membershipId);
			if (!membership) throw AppError.notFound("Staff not found");
			const user = await repo.findUserById(existingUserId);
			if (!user || user.status === false) throw AppError.notFound("Active user not found");
			const existing = await repo.findMembershipByUserAndClinic(context.clinicId, existingUserId);
			if (existing && existing.id !== membershipId) {
				throw AppError.badRequest("User already belongs to this clinic");
			}
			const updated = await repo.linkUserToMembership(context.clinicId, membershipId, existingUserId);
			if (!updated) throw AppError.badRequest("User already belongs to this clinic");
			const result = await repo.findByClinic(context.clinicId, membershipId);
			if (!result) throw AppError.notFound("Staff not found");
			return result;
	},

		async updateAccount(context: ClinicContext, membershipId: number, data: { email?: string; username?: string }) {
			if (Object.keys(data).length === 0) throw AppError.badRequest("At least one account field is required");
			const staff = await repo.findByClinic(context.clinicId, membershipId);
			if (!staff) throw AppError.notFound("Staff not found");
			if (data.email) {
				const duplicate = await repo.findUserByEmail(data.email.trim());
				if (duplicate && duplicate.id !== staff.user.id) throw AppError.badRequest("Email already exists");
			}
			try {
				const updated = await repo.updateUserAccount(staff.user.id, {
					email: data.email?.trim(),
					username: data.username?.trim(),
				});
				if (!updated) throw AppError.notFound("User not found");
				const result = await repo.findByClinic(context.clinicId, membershipId);
				if (!result) throw AppError.notFound("Staff not found");
				return result;
			} catch (error) {
				if (postgresErrorCode(error) === "23505") throw AppError.badRequest("Email already exists");
				throw error;
			}
	},

		async replaceRoles(context: ClinicContext, membershipId: number, roleIds: number[]) {
			const staff = await repo.findByClinic(context.clinicId, membershipId);
			if (!staff) throw AppError.notFound("Staff not found");
			for (const roleId of new Set(roleIds)) {
				if (!await repo.findActiveRoleByClinic(context.clinicId, roleId)) {
					throw AppError.notFound("Role not found in clinic");
				}
			}
			await repo.replaceMembershipRoles(context.clinicId, membershipId, [...new Set(roleIds)]);
			const result = await repo.findByClinic(context.clinicId, membershipId);
			if (!result) throw AppError.notFound("Staff not found");
			return result;
		},

		async listJobTitles(clinicId: number, status?: boolean) {
			const rows = await repo.listJobTitles(clinicId, status);
			return rows.map(normalizeJobTitle);
		},

		async createJobTitle(clinicId: number, data: { code: string; name: string; status?: boolean }) {
			if (await repo.findJobTitleByCode(clinicId, data.code)) {
				throw AppError.badRequest("Job title code already exists");
			}
			try {
				return normalizeJobTitle(await repo.createJobTitle(clinicId, data));
			} catch (error) {
				if (postgresErrorCode(error) === "23505") throw AppError.badRequest("Job title code already exists");
				throw error;
			}
		},

		async updateJobTitle(clinicId: number, id: number, data: { code?: string; name?: string; status?: boolean }) {
			if (Object.keys(data).length === 0) throw AppError.badRequest("At least one job title field is required");
			if (data.code && await repo.findJobTitleByCode(clinicId, data.code)) {
				const current = await repo.findJobTitleByClinic(clinicId, id);
				if (!current || current.code.toUpperCase() !== data.code.toUpperCase()) {
					throw AppError.badRequest("Job title code already exists");
				}
			}
			const result = await repo.updateJobTitle(clinicId, id, data);
			if (!result) throw AppError.notFound("Job title not found");
			return normalizeJobTitle(result);
		},
	};
}

export const staffService = createStaffService();
export type StaffService = ReturnType<typeof createStaffService>;
