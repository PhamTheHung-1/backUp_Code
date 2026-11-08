import { describe, expect, it } from "bun:test";
import type { ClinicContext } from "../clinic-context/clinic-context.service";
import type { OwnerListQuery, OwnersRepository } from "./owners.repository";
import type { Owner } from "./owners.schema";
import { createOwnersService } from "./owners.service";

const clinicAOwner: Owner = {
	id: 11,
	clinicId: 1,
	fullName: "Clinic A Owner",
	phone: null,
	email: null,
	address: null,
	status: true,
	createdAt: null,
	updatedAt: null,
};
const clinicBOwner: Owner = { ...clinicAOwner, id: 22, clinicId: 2, fullName: "Clinic B Owner" };

function context(clinicId: number): ClinicContext {
	return { clinicId, membershipId: clinicId * 10, branchScope: "all", branchIds: [], roleIds: [], permissions: [] };
}

function createRepository(): OwnersRepository {
	const records = [clinicAOwner, clinicBOwner];
	return {
		async listByClinic(clinicId: number, query: OwnerListQuery) {
			const filtered = records.filter(owner => owner.clinicId === clinicId && (query.status === undefined || owner.status === query.status));
			const start = (query.page - 1) * query.pageSize;
			return { items: filtered.slice(start, start + query.pageSize), total: filtered.length, page: query.page, pageSize: query.pageSize };
		},
		async findByClinic(clinicId, id) {
			return records.find(owner => owner.clinicId === clinicId && owner.id === id) ?? null;
		},
		async createByClinic(clinicId, data) {
			const owner: Owner = {
				...clinicAOwner,
				...data,
				id: 33,
				clinicId,
				status: true,
			};
			records.push(owner);
			return owner;
		},
		async updateByClinic(clinicId, id, data) {
			const owner = records.find(record => record.clinicId === clinicId && record.id === id);
			if (!owner) return null;
			Object.assign(owner, data);
			return owner;
		},
	};
}

describe("OwnersService clinic isolation", () => {
	it("lists only owners from the active clinic", async () => {
		const service = createOwnersService(createRepository());
		const result = await service.listOwnersByClinic(1, { page: 1, pageSize: 20 });
		expect(result.items.map(owner => owner.id)).toEqual([clinicAOwner.id]);
	});

	it("hides another clinic's owner on detail and update", async () => {
		const service = createOwnersService(createRepository());
		await expect(service.getOwnerByClinic(context(1), clinicBOwner.id)).rejects.toMatchObject({ statusCode: 404 });
		await expect(service.updateOwner(context(1), clinicBOwner.id, { fullName: "Changed across clinic" })).rejects.toMatchObject({
			statusCode: 404,
		});
	});

	it("creates and activates owners within the current clinic", async () => {
		const service = createOwnersService(createRepository());
		const owner = await service.createOwner(context(1), { fullName: "New owner" });
		expect(owner.clinicId).toBe(1);
		const updated = await service.updateOwner(context(1), owner.id, { status: false });
		expect(updated.status).toBe(false);
	});
});
