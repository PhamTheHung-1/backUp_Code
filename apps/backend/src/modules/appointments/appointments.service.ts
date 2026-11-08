import { AppError } from "@be/shared/errors/app-error";
import type { ClinicContext } from "../clinic-context/clinic-context.service";
import { getLocalParts, isValidBusinessTime, localDateTimeToUtc, parseAppointmentInterval, validateDateOnly } from "./appointment-time";
import {
	AppointmentConflictError,
	type AppointmentListQuery,
	type AppointmentState,
	type AppointmentsRepository,
	type AppointmentWriteData,
	appointmentsRepository,
	type ClinicHour,
} from "./appointments.repository";
import type { AppointmentCreate, AppointmentUpdate } from "./appointments.schema";

const CANCELLABLE_STATES: AppointmentState[] = ["booked", "confirmed", "arrived"];

function serializeAppointment<T extends { startAt: Date; endAt: Date; createdAt: Date | null; updatedAt: Date | null }>(appointment: T) {
	return {
		...appointment,
		startAt: appointment.startAt.toISOString(),
		endAt: appointment.endAt.toISOString(),
		createdAt: appointment.createdAt?.toISOString() ?? null,
		updatedAt: appointment.updatedAt?.toISOString() ?? null,
	};
}

function conflictError(error: unknown): never {
	if (error instanceof AppointmentConflictError) throw new AppError(409, error.message, "APPOINTMENT_CONFLICT");
	throw error;
}

export function createAppointmentsService(repo: AppointmentsRepository = appointmentsRepository) {
	async function clinicSettings(clinicId: number) {
		const settings = await repo.getClinicSettings(clinicId);
		if (!settings?.status) throw AppError.notFound("Clinic not found");
		return settings;
	}

	async function normalizedWriteData(
		clinicId: number,
		data: {
			petId: number;
			veterinarianId: number | null;
			startAt: string | Date;
			endAt: string | Date;
			reason?: string | null;
		},
	): Promise<AppointmentWriteData> {
		const pet = await repo.findActivePetByClinic(clinicId, data.petId);
		if (!pet) throw AppError.notFound("Active pet not found in this clinic");

		const { start, end } = parseAppointmentInterval(data.startAt, data.endAt);
		if (start <= new Date()) throw AppError.badRequest("Appointment must start in the future");
		const durationMinutes = (end.getTime() - start.getTime()) / 60_000;
		if (!Number.isInteger(durationMinutes) || durationMinutes < 5 || durationMinutes > 480 || durationMinutes % 5 !== 0) {
			throw AppError.badRequest("Appointment duration must be a multiple of 5 minutes between 5 and 480");
		}
		const settings = await clinicSettings(clinicId);
		const startLocal = getLocalParts(start, settings.timezone);
		const endLocal = getLocalParts(end, settings.timezone);
		if (startLocal.date !== endLocal.date) throw AppError.badRequest("Appointments must start and end on the same clinic-local date");
		if (start.getUTCSeconds() !== 0 || start.getUTCMilliseconds() !== 0 || end.getUTCSeconds() !== 0 || end.getUTCMilliseconds() !== 0) {
			throw AppError.badRequest("Appointment times must align to whole minutes");
		}

		const hours = await repo.listBusinessHoursByClinic(clinicId);
		const opening = hours.find(hour => hour.weekday === startLocal.weekday);
		if (!opening) throw AppError.badRequest("The clinic is closed on the selected day");
		if (startLocal.time < opening.openTime || endLocal.time > opening.closeTime) {
			throw AppError.badRequest("Appointment must be within clinic business hours");
		}

		if (data.veterinarianId !== null && !(await repo.isActiveVeterinarianByClinic(clinicId, data.veterinarianId))) {
			throw AppError.notFound("Active clinic veterinarian not found");
		}

		return {
			petId: pet.id,
			ownerId: pet.ownerId,
			veterinarianId: data.veterinarianId,
			startAt: start,
			endAt: end,
			reason: data.reason?.trim() || null,
		};
	}

	async function localDayRange(clinicId: number, date: string) {
		validateDateOnly(date);
		const settings = await clinicSettings(clinicId);
		const nextDate = new Date(`${date}T00:00:00.000Z`);
		nextDate.setUTCDate(nextDate.getUTCDate() + 1);
		const nextDateText = nextDate.toISOString().slice(0, 10);
		return {
			timezone: settings.timezone,
			from: localDateTimeToUtc(date, "00:00", settings.timezone),
			to: localDateTimeToUtc(nextDateText, "00:00", settings.timezone),
		};
	}

	return {
		listAppointmentsByClinic(clinicId: number, query: AppointmentListQuery) {
			return repo.listByClinic(clinicId, query).then(result => ({
				...result,
				items: result.items.map(serializeAppointment),
			}));
		},

		async getAppointmentByClinic(clinicId: number, id: number) {
			const appointment = await repo.findByClinic(clinicId, id);
			if (!appointment) throw AppError.notFound("Appointment not found");
			return serializeAppointment(appointment);
		},

		async getClinicBusinessHours(clinicId: number) {
			const settings = await clinicSettings(clinicId);
			return { timezone: settings.timezone, days: await repo.listBusinessHoursByClinic(clinicId) };
		},

		async setClinicBusinessHours(clinicId: number, days: ClinicHour[]) {
			await clinicSettings(clinicId);
			const weekdays = new Set<number>();
			for (const day of days) {
				if (weekdays.has(day.weekday)) throw AppError.badRequest("A weekday can only be configured once");
				if (!isValidBusinessTime(day.openTime) || !isValidBusinessTime(day.closeTime) || day.openTime >= day.closeTime) {
					throw AppError.badRequest("Clinic opening time must be before closing time");
				}
				weekdays.add(day.weekday);
			}
			await repo.replaceBusinessHoursByClinic(clinicId, days);
			return this.getClinicBusinessHours(clinicId);
		},

		async getAvailableSlots(clinicId: number, input: { date: string; durationMinutes: number; veterinarianId?: number }) {
			validateDateOnly(input.date);
			if (!Number.isInteger(input.durationMinutes) || input.durationMinutes < 5 || input.durationMinutes > 480 || input.durationMinutes % 5 !== 0) {
				throw AppError.badRequest("Duration must be a multiple of 5 minutes between 5 and 480");
			}
			const range = await localDayRange(clinicId, input.date);
			if (input.date < getLocalParts(new Date(), range.timezone).date) {
				throw AppError.badRequest("Available slots cannot be requested for a past date");
			}
			const hours = await repo.listBusinessHoursByClinic(clinicId);
			const weekday = new Date(`${input.date}T00:00:00.000Z`).getUTCDay();
			const opening = hours.find(hour => hour.weekday === weekday);
			if (!opening) return { date: input.date, durationMinutes: input.durationMinutes, timezone: range.timezone, slots: [] };

			const veterinarians = await repo.listVeterinariansByClinic(clinicId);
			const selectedVeterinarians =
				input.veterinarianId === undefined ? veterinarians : veterinarians.filter(veterinarian => veterinarian.id === input.veterinarianId);
			if (input.veterinarianId !== undefined && selectedVeterinarians.length === 0) {
				throw AppError.notFound("Active clinic veterinarian not found");
			}

			const busy = await repo.listBusyByClinic(
				clinicId,
				range.from,
				range.to,
				selectedVeterinarians.map(veterinarian => veterinarian.id),
			);
			const slots: { veterinarianId: number; veterinarianName: string; startAt: string; endAt: string }[] = [];
			const durationMs = input.durationMinutes * 60_000;
			for (const veterinarian of selectedVeterinarians) {
				for (
					let minute = timeToMinutes(opening.openTime);
					minute + input.durationMinutes <= timeToMinutes(opening.closeTime);
					minute += input.durationMinutes
				) {
					const startTime = minutesToTime(minute);
					const start = localDateTimeToUtc(input.date, startTime, range.timezone);
					if (start <= new Date()) continue;
					const end = new Date(start.getTime() + durationMs);
					const endLocal = getLocalParts(end, range.timezone);
					if (endLocal.date !== input.date || endLocal.time > opening.closeTime) continue;
					const hasConflict = busy.some(item => item.veterinarianId === veterinarian.id && item.startAt < end && item.endAt > start);
					if (!hasConflict) {
						slots.push({
							veterinarianId: veterinarian.id,
							veterinarianName: veterinarian.name,
							startAt: start.toISOString(),
							endAt: end.toISOString(),
						});
					}
				}
			}
			return { date: input.date, durationMinutes: input.durationMinutes, timezone: range.timezone, slots };
		},

		async getDailyQueueByClinic(clinicId: number, date: string) {
			const range = await localDayRange(clinicId, date);
			const items: Awaited<ReturnType<typeof repo.listByClinic>>["items"] = [];
			let page = 1;
			let total = 0;
			do {
				const result = await repo.listByClinic(clinicId, { page, pageSize: 100, from: range.from, to: range.to });
				items.push(...result.items);
				total = result.total;
				page += 1;
			} while (items.length < total);
			return { date, timezone: range.timezone, items: items.map(serializeAppointment) };
		},

		async createAppointment(context: ClinicContext, userId: number, input: AppointmentCreate) {
			const data = await normalizedWriteData(context.clinicId, {
				petId: input.petId,
				veterinarianId: input.veterinarianId ?? null,
				startAt: input.startAt,
				endAt: input.endAt,
				reason: input.reason,
			});
			try {
				return serializeAppointment(await repo.createByClinic(context.clinicId, userId, data));
			} catch (error) {
				conflictError(error);
			}
		},

		async updateAppointment(context: ClinicContext, id: number, input: AppointmentUpdate) {
			const current = await repo.findByClinic(context.clinicId, id);
			if (!current) throw AppError.notFound("Appointment not found");
			if (!["booked", "confirmed"].includes(current.status)) {
				throw AppError.badRequest("Only booked or confirmed appointments can be edited");
			}
			if (Object.values(input).every(value => value === undefined)) throw AppError.badRequest("At least one appointment field is required");

			const data = await normalizedWriteData(context.clinicId, {
				petId: input.petId ?? current.petId,
				veterinarianId: input.veterinarianId === undefined ? current.veterinarianId : input.veterinarianId,
				startAt: input.startAt ?? current.startAt,
				endAt: input.endAt ?? current.endAt,
				reason: input.reason === undefined ? current.reason : input.reason,
			});
			try {
				const updated = await repo.updateBookedByClinic(context.clinicId, id, data);
				if (!updated) throw AppError.badRequest("Appointment can no longer be edited");
				return serializeAppointment(updated);
			} catch (error) {
				conflictError(error);
			}
		},

		async transitionAppointment(clinicId: number, id: number, action: "confirm" | "check-in" | "start-exam" | "complete" | "cancel" | "no-show") {
			const transitions: Record<typeof action, { from: AppointmentState[]; to: AppointmentState }> = {
				confirm: { from: ["booked"], to: "confirmed" },
				"check-in": { from: ["confirmed"], to: "arrived" },
				"start-exam": { from: ["arrived"], to: "in_exam" },
				complete: { from: ["in_exam"], to: "completed" },
				cancel: { from: CANCELLABLE_STATES, to: "cancelled" },
				"no-show": { from: ["confirmed"], to: "no_show" },
			};
			const transition = transitions[action];
			const appointment = await repo.transitionByClinic(clinicId, id, transition.from, transition.to);
			if (!appointment) throw AppError.badRequest(`Appointment cannot transition to ${transition.to}`);
			return serializeAppointment(appointment);
		},

		async requireDailyQueue(clinicId: number, date: string) {
			return this.getDailyQueueByClinic(clinicId, date);
		},
	};
}

function timeToMinutes(value: string) {
	const [hours, minutes] = value.split(":").map(Number);
	return hours * 60 + minutes;
}

function minutesToTime(value: number) {
	return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

export const appointmentsService = createAppointmentsService();
export type AppointmentsService = ReturnType<typeof createAppointmentsService>;
