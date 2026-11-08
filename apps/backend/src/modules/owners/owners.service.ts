import { AppError } from "@be/shared/errors/app-error";
import type { ClinicContext } from "../clinic-context/clinic-context.service";
import type { OwnerListQuery, OwnersRepository } from "./owners.repository";
import { ownersRepository } from "./owners.repository";
import type { OwnerCreate, OwnerUpdate } from "./owners.schema";

export function createOwnersService(repo: OwnersRepository = ownersRepository) {
	return {
		listOwnersByClinic(clinicId: number, query: OwnerListQuery) {
			return repo.listByClinic(clinicId, query);
		},

		async getOwnerByClinic(context: ClinicContext, id: number) {
			const owner = await repo.findByClinic(context.clinicId, id);
			if (!owner) throw AppError.notFound("Owner not found");
			return owner;
		},

		createOwner(context: ClinicContext, data: OwnerCreate) {
			return repo.createByClinic(context.clinicId, data);
		},

		async updateOwner(context: ClinicContext, id: number, data: OwnerUpdate) {
			const safeData: OwnerUpdate = {
				fullName: data.fullName,
				phone: data.phone,
				email: data.email,
				address: data.address,
				status: data.status,
			};
			if (Object.values(safeData).every(value => value === undefined)) {
				throw AppError.badRequest("At least one owner field is required");
			}
			const owner = await repo.updateByClinic(context.clinicId, id, safeData);
			if (!owner) throw AppError.notFound("Owner not found");
			return owner;
		},
	};
}

export const ownersService = createOwnersService();
export type OwnersService = ReturnType<typeof createOwnersService>;
