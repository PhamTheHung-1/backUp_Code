import { describe, expect, it } from "bun:test";
import type { ClinicContext } from "../clinic-context/clinic-context.service";
import type { PetListQuery, PetsRepository } from "./pets.repository";
import { createPetsService } from "./pets.service";

type PetRecord = NonNullable<Awaited<ReturnType<PetsRepository["findByClinic"]>>>;

const clinicAPet: PetRecord = {
	id: 101,
	clinicId: 1,
	petCode: "C01",
	ownerId: 11,
	name: "Milo",
	species: "Cat",
	sex: "male",
	breed: null,
	dateOfBirth: null,
	color: null,
	microchipNumber: null,
	status: true,
	createdAt: null,
	updatedAt: null,
	ownerName: "Clinic A Owner",
	ownerPhone: "555-0101",
};
const clinicBPet: PetRecord = {
	...clinicAPet,
	id: 202,
	clinicId: 2,
	ownerId: 22,
	name: "Luna",
	ownerName: "Clinic B Owner",
};

function context(clinicId: number): ClinicContext {
	return { clinicId, membershipId: clinicId * 10, branchScope: "all", branchIds: [], roleIds: [], permissions: [] };
}

function createRepository(): PetsRepository {
	const records = [clinicAPet, clinicBPet];
	return {
		async listByClinic(clinicId: number, query: PetListQuery) {
			const filtered = records.filter(pet => pet.clinicId === clinicId);
			const start = (query.page - 1) * query.pageSize;
			return { items: filtered.slice(start, start + query.pageSize), total: filtered.length, page: query.page, pageSize: query.pageSize };
		},
		async findByClinic(clinicId, id) {
			return records.find(pet => pet.clinicId === clinicId && pet.id === id) ?? null;
		},
		async ownerExistsByClinic(clinicId, ownerId) {
			return (clinicId === 1 && ownerId === 11) || (clinicId === 2 && ownerId === 22);
		},
		async createByClinic(clinicId, data) {
			const pet: PetRecord = {
				...clinicAPet,
				...data,
				id: 303,
				clinicId,
				petCode: "D01",
				status: true,
				ownerName: clinicId === 1 ? "Clinic A Owner" : "Clinic B Owner",
				ownerPhone: "555-0101",
			};
			records.push(pet);
			return pet;
		},
		async updateByClinic(clinicId, id, data) {
			const pet = records.find(record => record.clinicId === clinicId && record.id === id);
			if (!pet) return null;
			Object.assign(pet, data);
			return pet;
		},
	};
}

describe("PetsService clinic isolation", () => {
	it("lists and reads only pets from the active clinic", async () => {
		const service = createPetsService(createRepository());
		const result = await service.listPetsByClinic(1, { page: 1, pageSize: 20 });
		expect(result.items.map(pet => pet.id)).toEqual([clinicAPet.id]);
		await expect(service.getPetByClinic(context(1), clinicBPet.id)).rejects.toMatchObject({ statusCode: 404 });
	});

	it("rejects pet create or reassignment to an owner from another clinic", async () => {
		const service = createPetsService(createRepository());
		await expect(service.createPet(context(1), { ownerId: 22, name: "Cross clinic", species: "Dog" })).rejects.toMatchObject({
			statusCode: 404,
		});
		await expect(service.updatePet(context(1), clinicAPet.id, { ownerId: 22 })).rejects.toMatchObject({ statusCode: 404 });
	});

	it("does not update a pet record from another clinic", async () => {
		const service = createPetsService(createRepository());
		await expect(service.updatePet(context(1), clinicBPet.id, { name: "Changed across clinic" })).rejects.toMatchObject({
			statusCode: 404,
		});
	});

	it("keeps the assigned display code stable when pet details are updated", async () => {
		const service = createPetsService(createRepository());
		const updatedPet = await service.updatePet(context(1), clinicAPet.id, { species: "Dog" });
		expect(updatedPet.petCode).toBe(clinicAPet.petCode);
	});
});
