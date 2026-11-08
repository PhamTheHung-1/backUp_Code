import { AppError } from "@be/shared/errors/app-error";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function validateDateOnly(date: string) {
	if (!DATE_PATTERN.test(date)) {
		throw AppError.badRequest("Date must be a valid YYYY-MM-DD value");
	}
	const parsed = new Date(`${date}T00:00:00.000Z`);
	if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
		throw AppError.badRequest("Date must be a valid YYYY-MM-DD value");
	}
}

export function parseAppointmentInterval(startAt: string | Date, endAt: string | Date) {
	const start = new Date(startAt);
	const end = new Date(endAt);
	if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start >= end) {
		throw AppError.badRequest("Appointment end time must be after start time");
	}
	return { start, end };
}

export function getLocalParts(date: Date, timezone: string) {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: timezone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hourCycle: "h23",
	}).formatToParts(date);
	const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
	return {
		date: `${values.year}-${values.month}-${values.day}`,
		time: `${values.hour}:${values.minute}`,
		weekday: new Date(`${values.year}-${values.month}-${values.day}T00:00:00.000Z`).getUTCDay(),
	};
}

export function localDateTimeToUtc(date: string, time: string, timezone: string): Date {
	validateDateOnly(date);
	if (!TIME_PATTERN.test(time)) throw AppError.badRequest("Time must use HH:mm");

	const [year, month, day] = date.split("-").map(Number);
	const [hour, minute] = time.split(":").map(Number);
	const target = Date.UTC(year, month - 1, day, hour, minute);
	let candidate = target;

	for (let iteration = 0; iteration < 3; iteration++) {
		const local = getLocalParts(new Date(candidate), timezone);
		const [localYear, localMonth, localDay] = local.date.split("-").map(Number);
		const [localHour, localMinute] = local.time.split(":").map(Number);
		const displayed = Date.UTC(localYear, localMonth - 1, localDay, localHour, localMinute);
		candidate += target - displayed;
	}

	const result = new Date(candidate);
	const local = getLocalParts(result, timezone);
	if (local.date !== date || local.time !== time) {
		throw AppError.badRequest("The requested local time does not exist in the clinic timezone");
	}
	return result;
}

export function isValidBusinessTime(value: string) {
	return TIME_PATTERN.test(value);
}
