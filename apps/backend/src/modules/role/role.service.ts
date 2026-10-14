import { type RoleRepository, roleRepository } from "./role.repository";
import type { InsertRole } from "./role.schema";

export function createRoleService(roleRepo: RoleRepository = roleRepository) {
	return {
		async listRoles() {
			return roleRepo.findAll();
		},

		async createRole(data: InsertRole) {
			return roleRepo.create(data);
		},

		// biome-ignore lint/suspicious/noExplicitAny: dynamic update object
		async updateRole(data: { id: number; [key: string]: any }) {
			const { id, ...updateData } = data;
			const result = await roleRepo.update(id, updateData);
			return { status: 0, data: result };
		},
	};
}

export const roleService = createRoleService();
export type RoleService = ReturnType<typeof createRoleService>;
