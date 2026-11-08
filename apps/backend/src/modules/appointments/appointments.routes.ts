import { AppError } from "@be/shared/errors/app-error";
import { t } from "elysia";
import type { App } from "../../App";
import { clinicContextService } from "../clinic-context/clinic-context.service";
import {
	appointmentCreateSchema,
	appointmentDetailResponseSchema,
	appointmentHoursSchema,
	appointmentListResponseSchema,
	appointmentQuerySchema,
	appointmentUpdateSchema,
	availableSlotsQuerySchema,
	availableSlotsResponseSchema,
	dailyQueueQuerySchema,
	dailyQueueResponseSchema,
} from "./appointments.schema";
import { type AppointmentsService, appointmentsService } from "./appointments.service";

const COLLECTION_PATH = "/api/appointments";
const DETAIL_PATH = "/api/appointments/:id";
const CLINIC_HOURS_PATH = "/api/appointments/clinic-hours";
const AVAILABLE_SLOTS_PATH = "/api/appointments/available-slots";
const DAILY_QUEUE_PATH = "/api/appointments/daily-queue";

type ClinicAuth = NonNullable<Parameters<typeof clinicContextService.requireClinicContext>[0]>;

function requireContext(clinicAuth: ClinicAuth | null) {
	if (!clinicAuth) throw AppError.unauthorized("Unauthenticated");
	return clinicContextService.requireClinicContext(clinicAuth);
}

function requirePermission(clinicAuth: ClinicAuth | null, method: string, path: string) {
	const context = requireContext(clinicAuth);
	clinicContextService.requireEndpointPermission(context, method, path);
	return context;
}

export function createAppointmentsRoutes(service: AppointmentsService = appointmentsService) {
	return (app: App) =>
		app
			.get("/clinic-hours", ({ clinicAuth }) => service.getClinicBusinessHours(requirePermission(clinicAuth, "GET", CLINIC_HOURS_PATH).clinicId), {
				response: t.Object({
					timezone: t.String(),
					days: t.Array(t.Object({ weekday: t.Number(), openTime: t.String(), closeTime: t.String() })),
				}),
				isAuth: true,
				detail: { summary: "Get weekly clinic business hours", tags: ["Appointment"], authType: 2 },
			})
			.put(
				"/clinic-hours",
				({ body, clinicAuth }) => service.setClinicBusinessHours(requirePermission(clinicAuth, "PUT", CLINIC_HOURS_PATH).clinicId, body.days),
				{
					body: appointmentHoursSchema,
					response: t.Object({
						timezone: t.String(),
						days: t.Array(t.Object({ weekday: t.Number(), openTime: t.String(), closeTime: t.String() })),
					}),
					isAuth: true,
					detail: { summary: "Configure weekly clinic business hours", tags: ["Appointment"], authType: 2 },
				},
			)
			.get(
				"/available-slots",
				({ query, clinicAuth }) => service.getAvailableSlots(requirePermission(clinicAuth, "GET", AVAILABLE_SLOTS_PATH).clinicId, query),
				{
					query: availableSlotsQuerySchema,
					response: availableSlotsResponseSchema,
					isAuth: true,
					detail: { summary: "List available clinic appointment slots", tags: ["Appointment"], authType: 2 },
				},
			)
			.get(
				"/daily-queue",
				({ query, clinicAuth }) => service.requireDailyQueue(requirePermission(clinicAuth, "GET", DAILY_QUEUE_PATH).clinicId, query.date),
				{
					query: dailyQueueQuerySchema,
					response: dailyQueueResponseSchema,
					isAuth: true,
					detail: { summary: "Return the daily clinic queue", tags: ["Appointment"], authType: 2 },
				},
			)
			.get(
				"",
				({ query, clinicAuth }) => {
					const context = requirePermission(clinicAuth, "GET", COLLECTION_PATH);
					return service.listAppointmentsByClinic(context.clinicId, {
						page: query.page ?? 1,
						pageSize: query.pageSize ?? 20,
						from: query.from ? new Date(query.from) : undefined,
						to: query.to ? new Date(query.to) : undefined,
						status: query.status,
						veterinarianId: query.veterinarianId,
					});
				},
				{
					query: appointmentQuerySchema,
					response: appointmentListResponseSchema,
					isAuth: true,
					detail: { summary: "List clinic appointments", tags: ["Appointment"], authType: 2 },
				},
			)
			.post(
				"",
				({ body, clinicAuth }) => {
					const context = requirePermission(clinicAuth, "POST", COLLECTION_PATH);
					if (!clinicAuth) throw AppError.unauthorized("Unauthenticated");
					return service.createAppointment(context, clinicAuth.user.id, body);
				},
				{
					body: appointmentCreateSchema,
					response: appointmentDetailResponseSchema,
					isAuth: true,
					detail: { summary: "Create a clinic appointment", tags: ["Appointment"], authType: 2 },
				},
			)
			.get(
				"/:id",
				({ params: { id }, clinicAuth }) => {
					const context = requirePermission(clinicAuth, "GET", DETAIL_PATH);
					return service.getAppointmentByClinic(context.clinicId, id);
				},
				{
					params: t.Object({ id: t.Numeric({ minimum: 1 }) }),
					response: appointmentDetailResponseSchema,
					isAuth: true,
					detail: { summary: "Get clinic appointment", tags: ["Appointment"], authType: 2 },
				},
			)
			.patch(
				"/:id",
				({ params: { id }, body, clinicAuth }) => {
					const context = requirePermission(clinicAuth, "PATCH", DETAIL_PATH);
					return service.updateAppointment(context, id, body);
				},
				{
					params: t.Object({ id: t.Numeric({ minimum: 1 }) }),
					body: appointmentUpdateSchema,
					response: appointmentDetailResponseSchema,
					isAuth: true,
					detail: { summary: "Edit a clinic appointment", tags: ["Appointment"], authType: 2 },
				},
			)
			.post(
				"/:id/confirm",
				({ params: { id }, clinicAuth }) => {
					const context = requirePermission(clinicAuth, "POST", "/api/appointments/:id/confirm");
					return service.transitionAppointment(context.clinicId, id, "confirm");
				},
				{
					params: t.Object({ id: t.Numeric({ minimum: 1 }) }),
					response: appointmentDetailResponseSchema,
					isAuth: true,
					detail: { summary: "Confirm an appointment", tags: ["Appointment"], authType: 2 },
				},
			)
			.post(
				"/:id/check-in",
				({ params: { id }, clinicAuth }) => {
					const context = requirePermission(clinicAuth, "POST", "/api/appointments/:id/check-in");
					return service.transitionAppointment(context.clinicId, id, "check-in");
				},
				{
					params: t.Object({ id: t.Numeric({ minimum: 1 }) }),
					response: appointmentDetailResponseSchema,
					isAuth: true,
					detail: { summary: "Check in an appointment", tags: ["Appointment"], authType: 2 },
				},
			)
			.post(
				"/:id/start-exam",
				({ params: { id }, clinicAuth }) => {
					const context = requirePermission(clinicAuth, "POST", "/api/appointments/:id/start-exam");
					return service.transitionAppointment(context.clinicId, id, "start-exam");
				},
				{
					params: t.Object({ id: t.Numeric({ minimum: 1 }) }),
					response: appointmentDetailResponseSchema,
					isAuth: true,
					detail: { summary: "Start the appointment examination", tags: ["Appointment"], authType: 2 },
				},
			)
			.post(
				"/:id/complete",
				({ params: { id }, clinicAuth }) => {
					const context = requirePermission(clinicAuth, "POST", "/api/appointments/:id/complete");
					return service.transitionAppointment(context.clinicId, id, "complete");
				},
				{
					params: t.Object({ id: t.Numeric({ minimum: 1 }) }),
					response: appointmentDetailResponseSchema,
					isAuth: true,
					detail: { summary: "Complete an appointment", tags: ["Appointment"], authType: 2 },
				},
			)
			.post(
				"/:id/cancel",
				({ params: { id }, clinicAuth }) => {
					const context = requirePermission(clinicAuth, "POST", "/api/appointments/:id/cancel");
					return service.transitionAppointment(context.clinicId, id, "cancel");
				},
				{
					params: t.Object({ id: t.Numeric({ minimum: 1 }) }),
					response: appointmentDetailResponseSchema,
					isAuth: true,
					detail: { summary: "Cancel an appointment", tags: ["Appointment"], authType: 2 },
				},
			)
			.post(
				"/:id/no-show",
				({ params: { id }, clinicAuth }) => {
					const context = requirePermission(clinicAuth, "POST", "/api/appointments/:id/no-show");
					return service.transitionAppointment(context.clinicId, id, "no-show");
				},
				{
					params: t.Object({ id: t.Numeric({ minimum: 1 }) }),
					response: appointmentDetailResponseSchema,
					isAuth: true,
					detail: { summary: "Mark an appointment as no-show", tags: ["Appointment"], authType: 2 },
				},
			);
}

export default createAppointmentsRoutes();
