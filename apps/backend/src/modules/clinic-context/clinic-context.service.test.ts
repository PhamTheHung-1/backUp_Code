import { describe, expect, it } from "bun:test";
import { AppError } from "@be/shared/errors/app-error";
import type { ClinicContextRepository, ClinicMembershipRecord } from "./clinic-context.repository";
import { createClinicContextService } from "./clinic-context.service";

const activeMembership = (overrides: Partial<ClinicMembershipRecord> = {}): ClinicMembershipRecord => ({
	membershipId: 10,
	clinicId: 1,
	clinicName: "Clinic One",
	clinicStatus: true,
	membershipStatus: "active",
	branchScope: "all",
	roleIds: [5],
	permissions: [1234],
	...overrides,
});

function createRepository(memberships: ClinicMembershipRecord[] = [activeMembership()]) {
	const repo: ClinicContextRepository = {
		findUserByEmail: async email => ({
			id: 7,
			email,
			status: true,
		}),
		findMembershipsByUserId: async () => memberships,
		findMembershipBranchIds: async () => [101],
		findBranchById: async id => (id === 999 ? { clinicId: 2, status: true } : id === 404 ? null : { clinicId: 1, status: true }),
	};
	return repo;
}

describe("ClinicContextService", () => {
	it("returns 401 when no authenticated bearer token is present", async () => {
		const service = createClinicContextService(createRepository());

		await expect(service.authenticateRequest(undefined, undefined)).rejects.toMatchObject({
			statusCode: 401,
		});
	});

	it("rejects tokens that do not identify an existing user", async () => {
		const repo = createRepository();
		repo.findUserByEmail = async () => null;
		const service = createClinicContextService(repo);

		await expect(
			service.authenticateRequest("Bearer valid-token", {
				verify: async () => ({ username: "missing@example.com" }),
			}),
		).rejects.toMatchObject({
			statusCode: 401,
		});
	});

	it("rejects users without a clinic membership", async () => {
		const service = createClinicContextService(createRepository([]));
		await expect(service.resolveRequest("user@example.com")).rejects.toMatchObject({
			statusCode: 403,
		});
	});

	it("resolves an active membership in its clinic", async () => {
		const service = createClinicContextService(createRepository());
		const context = await service.resolveRequest("user@example.com");

		expect(context.clinicContext?.clinicId).toBe(1);
		expect(context.clinicContext?.membershipId).toBe(10);
	});

	it("rejects resources belonging to another clinic", async () => {
		const service = createClinicContextService(createRepository());
		const context = await service.resolveRequest("user@example.com");
		const clinicContext = service.requireClinicContext(context);

		expect(() => service.assertResourceClinic(clinicContext, 2)).toThrow(AppError.notFound("Resource not found"));
	});

	it("rejects a requested clinic without an active membership", async () => {
		const service = createClinicContextService(createRepository());

		await expect(service.resolveRequest("user@example.com", "2")).rejects.toMatchObject({
			statusCode: 403,
		});
	});

	it("allows a permission granted by an active membership role", async () => {
		const service = createClinicContextService(createRepository());
		const context = await service.resolveRequest("user@example.com");

		expect(() => service.requirePermission(service.requireClinicContext(context), "1234")).not.toThrow();
	});

	it("denies a permission not granted by an active membership role", async () => {
		const service = createClinicContextService(createRepository());
		const context = await service.resolveRequest("user@example.com");

		expect(() => service.requirePermission(service.requireClinicContext(context), "5678")).toThrow(AppError.forbidden("Permission denied"));
	});

	it("rejects a disabled membership", async () => {
		const service = createClinicContextService(createRepository([activeMembership({ membershipStatus: "suspended" })]));

		await expect(service.resolveRequest("user@example.com")).rejects.toMatchObject({
			statusCode: 403,
		});
	});

	it("denies writes to an unassigned branch while allowing clinic-wide reads", async () => {
		const service = createClinicContextService(createRepository([activeMembership({ branchScope: "assigned" })]));
		const context = await service.resolveRequest("user@example.com");
		const clinicContext = service.requireClinicContext(context);

		await expect(service.requireBranchAccess(clinicContext, 102, "read")).resolves.toBeUndefined();
		await expect(service.requireBranchAccess(clinicContext, 102, "write")).rejects.toMatchObject({
			statusCode: 403,
		});
	});

	it("hides branches belonging to another clinic", async () => {
		const service = createClinicContextService(createRepository());
		const context = await service.resolveRequest("user@example.com");
		const clinicContext = service.requireClinicContext(context);

		await expect(service.requireBranchAccess(clinicContext, 999, "read")).rejects.toMatchObject({
			statusCode: 404,
		});
	});

	it("requires a selected clinic when the user has multiple active memberships", async () => {
		const service = createClinicContextService(
			createRepository([
				activeMembership(),
				activeMembership({
					membershipId: 11,
					clinicId: 2,
					clinicName: "Clinic Two",
				}),
			]),
		);

		await expect(service.resolveRequest("user@example.com")).rejects.toMatchObject({
			statusCode: 400,
		});
		await expect(service.resolveRequest("user@example.com", "2")).resolves.toMatchObject({
			clinicContext: { clinicId: 2 },
		});
	});
});
