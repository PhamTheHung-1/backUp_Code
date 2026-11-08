import { describe, expect, it } from "bun:test";
import { AppError } from "@be/shared/errors/app-error";
import type { RoleServiceRepository } from "./role.service";
import { createRoleService } from "./role.service";

describe("RoleService clinic isolation", () => {
	it("lists roles only for the selected clinic", async () => {
		let requestedClinicId = 0;
		const repository: RoleServiceRepository = {
			findAllByClinicId: async clinicId => {
				requestedClinicId = clinicId;
				return [];
			},
			create: async () => [{ id: 1 }],
			updateInClinic: async () => [],
		};
		const service = createRoleService(repository);

		await expect(service.listRoles(20)).resolves.toEqual([]);
		expect(requestedClinicId).toBe(20);
	});

	it("sets the role clinic from the authenticated context", async () => {
		let persistedClinicId = 0;
		const repository: RoleServiceRepository = {
			findAllByClinicId: async () => [],
			create: async data => {
				persistedClinicId = data.clinicId;
				return [{ id: 1 }];
			},
			updateInClinic: async () => [],
		};
		const service = createRoleService(repository);

		await service.createRole({ name: "Doctor" }, 20);

		expect(persistedClinicId).toBe(20);
	});

	it("updates a role only within the selected clinic", async () => {
		let updatedClinicId = 0;
		let updatedRoleId = 0;
		const repository: RoleServiceRepository = {
			findAllByClinicId: async () => [],
			create: async () => [{ id: 1 }],
			updateInClinic: async (roleId, clinicId) => {
				updatedRoleId = roleId;
				updatedClinicId = clinicId;
				return [{ id: roleId }];
			},
		};
		const service = createRoleService(repository);

		await service.updateRole({ id: 8, name: "Doctor" }, 20);

		expect(updatedRoleId).toBe(8);
		expect(updatedClinicId).toBe(20);
	});

	it("returns not found when the role does not belong to the selected clinic", async () => {
		const repository: RoleServiceRepository = {
			findAllByClinicId: async () => [],
			create: async () => [{ id: 1 }],
			updateInClinic: async () => [],
		};
		const service = createRoleService(repository);

		await expect(service.updateRole({ id: 8, name: "Doctor" }, 20)).rejects.toThrow(AppError.notFound("Role not found"));
	});
});
