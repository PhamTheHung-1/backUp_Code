import { AppError } from "@be/shared/errors/app-error";
import { type RoleRepository, roleRepository } from "./role.repository";
import type { InsertRole } from "./role.schema";

type ClinicRoleInput = Omit<InsertRole, "clinicId">;
export type RoleServiceRepository = Pick<RoleRepository, "findAllByClinicId" | "create" | "updateInClinic">;

export function createRoleService(roleRepo: RoleServiceRepository = roleRepository) {
	return {
		async listRoles(clinicId: number) {
			return roleRepo.findAllByClinicId(clinicId);
		},

		async createRole(data: ClinicRoleInput, clinicId: number) {
			return roleRepo.create({ ...data, clinicId });
		},

		async updateRole(data: { id: number } & Partial<ClinicRoleInput>, clinicId: number) {
			const { id, ...updateData } = data;
			const result = await roleRepo.updateInClinic(id, clinicId, updateData);
			if (result.length === 0) throw AppError.notFound("Role not found");
			return { status: 0, data: result };
		},
	};
}

export const roleService = createRoleService();
export type RoleService = ReturnType<typeof createRoleService>;
