 import { beforeAll, describe, expect, it } from "bun:test";
import { AppError } from "@be/shared/errors/app-error";
import Elysia from "elysia";
import type { App } from "../../App";
import type { OwnersRepository } from "../owners/owners.repository";
import { createOwnersRoutes } from "../owners/owners.routes";
import type { Owner } from "../owners/owners.schema";
import { createOwnersService } from "../owners/owners.service";
import type { PetListQuery, PetsRepository } from "../pets/pets.repository";
import { createPetsRoutes } from "../pets/pets.routes";
import { createPetsService } from "../pets/pets.service";
import type { ClinicContext, RequestClinicContext } from "./clinic-context.service";

const ownerA: Owner = {
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
const ownerB: Owner = { ...ownerA, id: 22, clinicId: 2, fullName: "Clinic B Owner" };
const inactiveOwnerA: Owner = { ...ownerA, id: 12, fullName: "Inactive A Owner", status: false };

type PetRecord = NonNullable<Awaited<ReturnType<PetsRepository["findByClinic"]>>>;
const petA: PetRecord = {
	id: 101,
	clinicId: 1,
	petCode: "C01",
	ownerId: ownerA.id,
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
	ownerName: ownerA.fullName,
	ownerPhone: ownerA.phone,
};
const petB: PetRecord = { ...petA, id: 202, clinicId: 2, petCode: "C01", ownerId: ownerB.id, name: "Luna", ownerName: ownerB.fullName };
const inactivePetA: PetRecord = { ...petA, id: 102, petCode: "C02", name: "Inactive", status: false };

const apiPermissions = [
	"GET-/api/owners",
	"GET-/api/owners/:id",
	"POST-/api/owners",
	"PATCH-/api/owners/:id",
	"GET-/api/pets",
	"GET-/api/pets/:id",
	"POST-/api/pets",
	"PATCH-/api/pets/:id",
].map(permission => Bun.hash.xxHash32(permission));

const clinicContext: ClinicContext = {
	clinicId: 1,
	membershipId: 10,
	branchScope: "all",
	branchIds: [],
	roleIds: [1],
	permissions: apiPermissions,
};
const authenticatedClinic: RequestClinicContext = {
	user: { id: 7, email: "staff@example.com" },
	clinicContext,
	availableClinics: [{ id: 1, name: "Clinic A" }],
};

function createApiApp(prefix: string, register: (app: App) => App, context: RequestClinicContext | null = authenticatedClinic) {
	const app = new Elysia({ prefix })
		.macro({
			isAuth: (enabled: boolean) => ({
				resolve: ({ request }) => ({
					clinicAuth: enabled && request.headers.has("authorization") ? context : null,
				}),
			}),
		})
		.onError(({ error, set }) => {
			if (error instanceof AppError) {
				set.status = error.statusCode;
				return error.message;
			}
		});
	return register(app as unknown as App);
}

function createOwnersRepo(): OwnersRepository {
	const records = [ownerA, inactiveOwnerA, ownerB];
	return {
		async listByClinic(clinicId, query) {
			const items = records.filter(
				owner =>
					owner.clinicId === clinicId &&
					(query.status === undefined || owner.status === query.status) &&
					(!query.search || owner.fullName.toLowerCase().includes(query.search.toLowerCase())),
			);
			const offset = (query.page - 1) * query.pageSize;
			return { items: items.slice(offset, offset + query.pageSize), total: items.length, page: query.page, pageSize: query.pageSize };
		},
		async findByClinic(clinicId, id) {
			return records.find(owner => owner.clinicId === clinicId && owner.id === id) ?? null;
		},
		async createByClinic(clinicId, data) {
			const owner = { ...ownerA, ...data, id: 33, clinicId };
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

function createPetsRepo(): PetsRepository {
	const records = [petA, inactivePetA, petB];
	return {
		async listByClinic(clinicId: number, query: PetListQuery) {
			const items = records.filter(
				pet =>
					pet.clinicId === clinicId &&
					(!query.species || pet.species === query.species) &&
					(!query.sex || pet.sex === query.sex) &&
					(query.status === undefined || pet.status === query.status) &&
					(!query.search ||
						pet.name.toLowerCase().includes(query.search.toLowerCase()) ||
						pet.petCode.toLowerCase().includes(query.search.toLowerCase())),
			);
			const offset = (query.page - 1) * query.pageSize;
			return { items: items.slice(offset, offset + query.pageSize), total: items.length, page: query.page, pageSize: query.pageSize };
		},
		async findByClinic(clinicId, id) {
			return records.find(pet => pet.clinicId === clinicId && pet.id === id) ?? null;
		},
		async ownerExistsByClinic(clinicId, ownerId) {
			return (clinicId === 1 && ownerId === ownerA.id) || (clinicId === 2 && ownerId === ownerB.id);
		},
		async createByClinic(clinicId, data) {
			const ownerName = clinicId === 1 ? ownerA.fullName : ownerB.fullName;
			const pet = { ...petA, ...data, id: 303, clinicId, petCode: "D01", ownerName };
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

let ownersApp: ReturnType<typeof createApiApp>;
let petsApp: ReturnType<typeof createApiApp>;

beforeAll(() => {
	ownersApp = createApiApp("/api/owners", app => createOwnersRoutes(createOwnersService(createOwnersRepo()))(app));
	petsApp = createApiApp("/api/pets", app => createPetsRoutes(createPetsService(createPetsRepo()))(app));
});

describe("Owner and pet API clinic isolation", () => {
	it("returns 401 without the existing authenticated user context", async () => {
		const ownerResponse = await ownersApp.handle(new Request("http://localhost/api/owners"));
		const petResponse = await petsApp.handle(new Request("http://localhost/api/pets"));
		expect(ownerResponse.status).toBe(401);
		expect(petResponse.status).toBe(401);
	});

	it("returns only Clinic A owners and pets from collection endpoints", async () => {
		const headers = { authorization: "Bearer test-token" };
		const ownersResponse = await ownersApp.handle(new Request("http://localhost/api/owners", { headers }));
		const petsResponse = await petsApp.handle(new Request("http://localhost/api/pets", { headers }));
		expect(ownersResponse.status).toBe(200);
		expect((await ownersResponse.json()).items.map((owner: Owner) => owner.id)).toEqual([ownerA.id, inactiveOwnerA.id]);
		expect(petsResponse.status).toBe(200);
		const petList = await petsResponse.json();
		expect(petList.items.map((pet: PetRecord) => pet.id)).toEqual([petA.id, inactivePetA.id]);
		expect(petList.items[0].petCode).toBe("C01");
	});

	it("applies server-side filters, pagination, and query validation", async () => {
		const headers = { authorization: "Bearer test-token" };
		const ownersResponse = await ownersApp.handle(
			new Request("http://localhost/api/owners?search=inactive&page=1&pageSize=10&status=false", { headers }),
		);
		const petsResponse = await petsApp.handle(
			new Request("http://localhost/api/pets?species=Cat&sex=male&page=1&pageSize=10&status=true", { headers }),
		);
		const petCodeSearchResponse = await petsApp.handle(new Request("http://localhost/api/pets?search=C01", { headers }));
		const invalidPageResponse = await petsApp.handle(new Request("http://localhost/api/pets?pageSize=101", { headers }));
		const fractionalPageResponse = await ownersApp.handle(new Request("http://localhost/api/owners?page=1.5", { headers }));
		expect(ownersResponse.status).toBe(200);
		expect((await ownersResponse.json()).items.map((owner: Owner) => owner.id)).toEqual([inactiveOwnerA.id]);
		expect(petsResponse.status).toBe(200);
		expect((await petsResponse.json()).items.map((pet: PetRecord) => pet.id)).toEqual([petA.id]);
		expect(petCodeSearchResponse.status).toBe(200);
		expect((await petCodeSearchResponse.json()).items.map((pet: PetRecord) => pet.petCode)).toEqual(["C01"]);
		expect(invalidPageResponse.status).toBe(422);
		expect(fractionalPageResponse.status).toBe(422);
	});

	it("hides and prevents updates to Clinic B records when Clinic A IDs are supplied", async () => {
		const headers = { authorization: "Bearer test-token", "content-type": "application/json" };
		for (const [app, path, patch] of [
			[ownersApp, `/api/owners/${ownerB.id}`, { fullName: "Tampered" }],
			[petsApp, `/api/pets/${petB.id}`, { name: "Tampered" }],
		] as const) {
			const getResponse = await app.handle(new Request(`http://localhost${path}`, { headers }));
			const patchResponse = await app.handle(
				new Request(`http://localhost${path}`, {
					method: "PATCH",
					headers,
					body: JSON.stringify(patch),
				}),
			);
			expect(getResponse.status).toBe(404);
			expect(patchResponse.status).toBe(404);
		}
	});

	it("rejects a pet linked to an owner outside the active clinic", async () => {
		const response = await petsApp.handle(
			new Request("http://localhost/api/pets", {
				method: "POST",
				headers: { authorization: "Bearer test-token", "content-type": "application/json" },
				body: JSON.stringify({ ownerId: ownerB.id, name: "Cross clinic", species: "Dog" }),
			}),
		);
		expect(response.status).toBe(404);
	});

	it("derives clinic scope from authentication instead of create or update request bodies", async () => {
		const headers = { authorization: "Bearer test-token", "content-type": "application/json" };
		const ownerCreate = await ownersApp.handle(
			new Request("http://localhost/api/owners", {
				method: "POST",
				headers,
				body: JSON.stringify({ fullName: "Untrusted scope", clinicId: 2 }),
			}),
		);
		const petCreate = await petsApp.handle(
			new Request("http://localhost/api/pets", {
				method: "POST",
				headers,
				body: JSON.stringify({ ownerId: ownerA.id, name: "Untrusted scope", species: "Dog", clinicId: 2 }),
			}),
		);
		const ownerUpdate = await ownersApp.handle(
			new Request(`http://localhost/api/owners/${ownerA.id}`, {
				method: "PATCH",
				headers,
				body: JSON.stringify({ clinicId: 2 }),
			}),
		);
		const petUpdate = await petsApp.handle(
			new Request(`http://localhost/api/pets/${petA.id}`, {
				method: "PATCH",
				headers,
				body: JSON.stringify({ clinicId: 2 }),
			}),
		);
		const petCodeUpdate = await petsApp.handle(
			new Request(`http://localhost/api/pets/${petA.id}`, {
				method: "PATCH",
				headers,
				body: JSON.stringify({ petCode: "D99" }),
			}),
		);
		expect(ownerCreate.status).toBe(200);
		expect((await ownerCreate.json()).clinicId).toBe(1);
		expect(petCreate.status).toBe(200);
		expect((await petCreate.json()).clinicId).toBe(1);
		expect(ownerUpdate.status).not.toBe(200);
		expect(petUpdate.status).not.toBe(200);
		expect([400, 422]).toContain(petCodeUpdate.status);
	});

	it("enforces membership role permissions on API routes", async () => {
		const noPermissions: RequestClinicContext = { ...authenticatedClinic, clinicContext: { ...clinicContext, permissions: [] } };
		const app = createApiApp("/api/owners", register => createOwnersRoutes(createOwnersService(createOwnersRepo()))(register), noPermissions);
		const response = await app.handle(new Request("http://localhost/api/owners", { headers: { authorization: "Bearer test-token" } }));
		expect(response.status).toBe(403);
	});

	it("uses the API permission hashes registered for the actual method and route", () => {
		for (const route of [...ownersApp.routes, ...petsApp.routes]) {
			const id = Bun.hash.xxHash32(`${route.method}-${route.path}`);
			expect(apiPermissions).toContain(id);
		}
	});
});
