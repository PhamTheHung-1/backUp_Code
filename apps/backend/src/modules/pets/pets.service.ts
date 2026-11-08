import { AppError } from "@be/shared/errors/app-error";
import type { ClinicContext } from "../clinic-context/clinic-context.service";
import type { PetListQuery, PetsRepository } from "./pets.repository";
import { petsRepository } from "./pets.repository";
import type { PetCreate, PetUpdate } from "./pets.schema";

export function createPetsService(repo: PetsRepository = petsRepository) {
	return {
		listPetsByClinic(clinicId: number, query: PetListQuery) {
			return repo.listByClinic(clinicId, query);
		},

		async getPetByClinic(context: ClinicContext, id: number) {
			const pet = await repo.findByClinic(context.clinicId, id);
			if (!pet) throw AppError.notFound("Pet not found");
			return pet;
		},

		async createPet(context: ClinicContext, data: PetCreate) {
			if (!(await repo.ownerExistsByClinic(context.clinicId, data.ownerId))) {
				throw AppError.notFound("Owner not found");
			}
			const pet = await repo.createByClinic(context.clinicId, data);
			if (!pet) throw AppError.internal("Created pet could not be loaded");
			return pet;
		},

		async updatePet(context: ClinicContext, id: number, data: PetUpdate) {
			const safeData: PetUpdate = {
				ownerId: data.ownerId,
				name: data.name,
				species: data.species,
				sex: data.sex,
				breed: data.breed,
				dateOfBirth: data.dateOfBirth,
				color: data.color,
				microchipNumber: data.microchipNumber,
				status: data.status,
			};
			if (Object.values(safeData).every(value => value === undefined)) {
				throw AppError.badRequest("At least one pet field is required");
			}
			if (safeData.ownerId !== undefined && !(await repo.ownerExistsByClinic(context.clinicId, safeData.ownerId))) {
				throw AppError.notFound("Owner not found");
			}
			const pet = await repo.updateByClinic(context.clinicId, id, safeData);
			if (!pet) throw AppError.notFound("Pet not found");
			return pet;
		},
	};
}

export const petsService = createPetsService();
export type PetsService = ReturnType<typeof createPetsService>;
