import { describe, expect, it } from "bun:test";
import { AppError } from "@be/shared/errors/app-error";
import Elysia from "elysia";
import type { App } from "../../App";
import type { ClinicContext, RequestClinicContext } from "../clinic-context/clinic-context.service";
import {
	AppointmentConflictError,
	type AppointmentRecord,
	type AppointmentState,
	type AppointmentsRepository,
	type ClinicHour,
} from "./appointments.repository";
import { createAppointmentsRoutes } from "./appointments.routes";
import { createAppointmentsService } from "./appointments.service";

const clinicAAppointment: AppointmentRecord = {
	id: 101,
	clinicId: 1,
	petId: 10,
	ownerId: 11,
	veterinarianId: 7,
	startAt: new Date("2026-10-12T09:00:00.000Z"),
	endAt: new Date("2026-10-12T09:30:00.000Z"),
	status: "booked",
	reason: null,
	createdBy: 5,
	createdAt: null,
	updatedAt: null,
	petName: "Milo",
	petCode: "C01",
	ownerName: "Clinic A Owner",
	ownerPhone: null,
	veterinarianName: "Dr A",
};

const clinicBAppointment: AppointmentRecord = {
	...clinicAAppointment,
	id: 202,
	clinicId: 2,
	petId: 20,
	ownerId: 22,
	veterinarianId: 8,
};

const nextMonday = (() => {
	const date = new Date();
	date.setUTCDate(date.getUTCDate() + 7);
	date.setUTCDate(date.getUTCDate() + ((8 - date.getUTCDay()) % 7));
	return date.toISOString().slice(0, 10);
})();

function appointmentTime(time: string) {
	return `${nextMonday}T${time}:00.000Z`;
}

const context: ClinicContext = {
	clinicId: 1,
	membershipId: 1,
	branchScope: "all",
	branchIds: [],
	roleIds: [],
	permissions: [],
};

function createRepository(options: { conflictOnCreate?: boolean } = {}) {
	const records = [{ ...clinicAAppointment }, { ...clinicBAppointment }];
	const hours: ClinicHour[] = [{ weekday: 1, openTime: "09:00", closeTime: "10:00" }];
	const repository: AppointmentsRepository = {
		async listByClinic(clinicId, query) {
			const filtered = records
				.filter(record => record.clinicId === clinicId)
				.filter(record => !query.from || record.startAt >= query.from)
				.filter(record => !query.to || record.startAt < query.to)
				.filter(record => !query.status || record.status === query.status)
				.filter(record => query.veterinarianId === undefined || record.veterinarianId === query.veterinarianId);
			const page = query.page ?? 1;
			const pageSize = query.pageSize ?? 20;
			const start = (page - 1) * pageSize;
			return { items: filtered.slice(start, start + pageSize), total: filtered.length, page, pageSize };
		},
		async findByClinic(clinicId, id) {
			return records.find(record => record.clinicId === clinicId && record.id === id) ?? null;
		},
		async findActivePetByClinic(clinicId, petId) {
			return clinicId === 1 && petId === 10 ? { id: petId, ownerId: 11 } : null;
		},
		async isActiveVeterinarianByClinic(clinicId, veterinarianId) {
			return clinicId === 1 && veterinarianId === 7;
		},
		async listVeterinariansByClinic(clinicId) {
			return clinicId === 1 ? [{ id: 7, name: "Dr A" }] : [];
		},
		async getClinicSettings(clinicId) {
			return clinicId === 1 ? { timezone: "UTC", status: true } : null;
		},
		async listBusinessHoursByClinic(clinicId) {
			return clinicId === 1 ? hours : [];
		},
		async replaceBusinessHoursByClinic(clinicId, nextHours) {
			if (clinicId === 1) hours.splice(0, hours.length, ...nextHours);
			return nextHours;
		},
		async listBusyByClinic() {
			return [];
		},
		async createByClinic(clinicId, createdBy, data) {
			if (options.conflictOnCreate) throw new AppointmentConflictError();
			const record: AppointmentRecord = {
				...clinicAAppointment,
				...data,
				id: 303,
				clinicId,
				createdBy,
				status: "booked",
			};
			records.push(record);
			return record;
		},
		async updateBookedByClinic(clinicId, id, data) {
			const record = records.find(item => item.clinicId === clinicId && item.id === id && ["booked", "confirmed"].includes(item.status));
			if (!record) return null;
			Object.assign(record, data);
			return record;
		},
		async transitionByClinic(clinicId, id, from: AppointmentState[], to: AppointmentState) {
			const record = records.find(item => item.clinicId === clinicId && item.id === id && from.some(state => state === item.status));
			if (!record) return null;
			record.status = to;
			return record;
		},
	};
	return repository;
}

describe("AppointmentsService clinic scope and workflow", () => {
	it("lists only the selected clinic and hides a foreign clinic appointment", async () => {
		const service = createAppointmentsService(createRepository());
		const list = await service.listAppointmentsByClinic(1, { page: 1, pageSize: 20 });
		expect(list.items.map(item => item.id)).toEqual([clinicAAppointment.id]);
		await expect(service.getAppointmentByClinic(1, clinicBAppointment.id)).rejects.toMatchObject({ statusCode: 404 });
	});

	it("rejects pets and veterinarians outside the active clinic", async () => {
		const service = createAppointmentsService(createRepository());
		await expect(
			service.createAppointment(context, 5, {
				petId: 20,
				veterinarianId: 7,
				startAt: appointmentTime("09:00"),
				endAt: appointmentTime("09:30"),
			}),
		).rejects.toMatchObject({ statusCode: 404 });
		await expect(
			service.createAppointment(context, 5, {
				petId: 10,
				veterinarianId: 8,
				startAt: appointmentTime("09:00"),
				endAt: appointmentTime("09:30"),
			}),
		).rejects.toMatchObject({ statusCode: 404 });
	});

	it("returns a conflict response when a slot is already occupied", async () => {
		const service = createAppointmentsService(createRepository({ conflictOnCreate: true }));
		await expect(
			service.createAppointment(context, 5, {
				petId: 10,
				veterinarianId: 7,
				startAt: appointmentTime("09:00"),
				endAt: appointmentTime("09:30"),
			}),
		).rejects.toMatchObject({ statusCode: 409 });
	});

	it("rejects appointments whose start time is not in the future", async () => {
		const service = createAppointmentsService(createRepository());
		const startAt = new Date(Date.now() - 60_000);
		const endAt = new Date(Date.now() + 60_000);
		await expect(
			service.createAppointment(context, 5, {
				petId: 10,
				veterinarianId: 7,
				startAt: startAt.toISOString(),
				endAt: endAt.toISOString(),
			}),
		).rejects.toMatchObject({ statusCode: 400 });
	});

	it("enforces the appointment state transition sequence", async () => {
		const service = createAppointmentsService(createRepository());
		expect((await service.transitionAppointment(1, 101, "confirm")).status).toBe("confirmed");
		expect((await service.transitionAppointment(1, 101, "check-in")).status).toBe("arrived");
		expect((await service.transitionAppointment(1, 101, "start-exam")).status).toBe("in_exam");
		expect((await service.transitionAppointment(1, 101, "complete")).status).toBe("completed");
		await expect(service.transitionAppointment(1, 101, "complete")).rejects.toBeInstanceOf(AppError);
	});

	it("supports cancellation and no-show only from allowed states", async () => {
		const cancelService = createAppointmentsService(createRepository());
		expect((await cancelService.transitionAppointment(1, 101, "cancel")).status).toBe("cancelled");

		const noShowService = createAppointmentsService(createRepository());
		await noShowService.transitionAppointment(1, 101, "confirm");
		expect((await noShowService.transitionAppointment(1, 101, "no-show")).status).toBe("no_show");
	});

	it("builds available slots using the clinic timezone and business hours", async () => {
		const service = createAppointmentsService(createRepository());
		const result = await service.getAvailableSlots(1, { date: nextMonday, durationMinutes: 30 });
		expect(result.timezone).toBe("UTC");
		expect(result.slots.map(slot => slot.startAt)).toEqual([appointmentTime("09:00"), appointmentTime("09:30")]);
	});
});

const API_PERMISSION_PATHS = [
	"GET-/api/appointments",
	"GET-/api/appointments/:id",
	"POST-/api/appointments",
	"PATCH-/api/appointments/:id",
	"POST-/api/appointments/:id/confirm",
	"POST-/api/appointments/:id/check-in",
	"POST-/api/appointments/:id/start-exam",
	"POST-/api/appointments/:id/complete",
	"POST-/api/appointments/:id/cancel",
	"POST-/api/appointments/:id/no-show",
	"GET-/api/appointments/clinic-hours",
	"PUT-/api/appointments/clinic-hours",
	"GET-/api/appointments/available-slots",
	"GET-/api/appointments/daily-queue",
].map(permission => Bun.hash.xxHash32(permission));

function createAppointmentsApi(permissions: number[]) {
	const requestContext: RequestClinicContext = {
		user: { id: 5, email: "staff@example.com" },
		clinicContext: { ...context, permissions },
		availableClinics: [{ id: 1, name: "Clinic A" }],
	};
	const app = new Elysia({ prefix: "/api/appointments" })
		.macro({
			isAuth: (enabled: boolean) => ({
				resolve: ({ request }) => ({
					clinicAuth: enabled && request.headers.has("authorization") ? requestContext : null,
				}),
			}),
		})
		.onError(({ error, set }) => {
			if (error instanceof AppError) {
				set.status = error.statusCode;
				return error.message;
			}
		});
	return createAppointmentsRoutes(createAppointmentsService(createRepository()))(app as unknown as App);
}

describe("Appointments API authorization", () => {
	it("requires authentication and endpoint permission", async () => {
		const noPermissionApi = createAppointmentsApi([]);
		const responseWithoutAuth = await noPermissionApi.handle(new Request("http://localhost/api/appointments"));
		const responseWithoutPermission = await noPermissionApi.handle(
			new Request("http://localhost/api/appointments", { headers: { authorization: "Bearer valid" } }),
		);
		expect(responseWithoutAuth.status).toBe(401);
		expect(responseWithoutPermission.status).toBe(403);
	});

	it("scopes collection and detail reads to the authenticated clinic", async () => {
		const api = createAppointmentsApi(API_PERMISSION_PATHS);
		const headers = { authorization: "Bearer valid" };
		const collection = await api.handle(new Request("http://localhost/api/appointments", { headers }));
		const clinicARecord = await api.handle(new Request("http://localhost/api/appointments/101", { headers }));
		const clinicBRecord = await api.handle(new Request("http://localhost/api/appointments/202", { headers }));
		const patchClinicBRecord = await api.handle(
			new Request("http://localhost/api/appointments/202", {
				method: "PATCH",
				headers: { ...headers, "content-type": "application/json" },
				body: JSON.stringify({ reason: "Must not update another clinic" }),
			}),
		);
		expect(collection.status).toBe(200);
		expect((await collection.json()).items.map((item: AppointmentRecord) => item.id)).toEqual([clinicAAppointment.id]);
		expect(clinicARecord.status).toBe(200);
		expect(clinicBRecord.status).toBe(404);
		expect(patchClinicBRecord.status).toBe(404);
	});

	it("does not accept a client-supplied status or a pet from another clinic", async () => {
		const api = createAppointmentsApi(API_PERMISSION_PATHS);
		const headers = { authorization: "Bearer valid", "content-type": "application/json" };
		const statusSpoof = await api.handle(
			new Request("http://localhost/api/appointments", {
				method: "POST",
				headers,
				body: JSON.stringify({
					petId: 10,
					veterinarianId: 7,
					startAt: appointmentTime("10:00"),
					endAt: appointmentTime("10:30"),
					status: "completed",
				}),
			}),
		);
		const foreignPet = await api.handle(
			new Request("http://localhost/api/appointments", {
				method: "POST",
				headers,
				body: JSON.stringify({
					petId: 20,
					veterinarianId: 7,
					startAt: appointmentTime("10:00"),
					endAt: appointmentTime("10:30"),
				}),
			}),
		);
		expect(statusSpoof.status).toBe(400);
		expect(foreignPet.status).toBe(404);
	});

	it("performs status changes only through controlled transition endpoints", async () => {
		const api = createAppointmentsApi(API_PERMISSION_PATHS);
		const response = await api.handle(
			new Request("http://localhost/api/appointments/101/confirm", {
				method: "POST",
				headers: { authorization: "Bearer valid" },
			}),
		);
		expect(response.status).toBe(200);
		expect((await response.json()).status).toBe("confirmed");
	});
});
