import { describe, expect, it } from "bun:test";
import { AppError } from "@be/shared/errors/app-error";
import { getLocalParts, localDateTimeToUtc, parseAppointmentInterval, validateDateOnly } from "./appointment-time";

describe("appointment time helpers", () => {
	it("accepts valid calendar dates and rejects impossible dates as a client error", () => {
		expect(() => validateDateOnly("2024-02-29")).not.toThrow();
		expect(() => validateDateOnly("2025-02-29")).toThrow(AppError);
		expect(() => validateDateOnly("not-a-date")).toThrow(AppError);
	});

	it("converts clinic-local time to UTC and back", () => {
		const result = localDateTimeToUtc("2025-01-15", "09:30", "Asia/Ho_Chi_Minh");
		expect(result.toISOString()).toBe("2025-01-15T02:30:00.000Z");
		expect(getLocalParts(result, "Asia/Ho_Chi_Minh")).toMatchObject({
			date: "2025-01-15",
			time: "09:30",
			weekday: 3,
		});
	});

	it("rejects nonexistent daylight-saving local times", () => {
		expect(() => localDateTimeToUtc("2025-03-09", "02:30", "America/New_York")).toThrow(AppError);
	});

	it("requires a valid increasing appointment interval", () => {
		expect(parseAppointmentInterval("2025-01-15T09:00:00.000Z", "2025-01-15T09:30:00.000Z").end.toISOString()).toBe("2025-01-15T09:30:00.000Z");
		expect(() => parseAppointmentInterval("invalid", "2025-01-15T09:30:00.000Z")).toThrow(AppError);
		expect(() => parseAppointmentInterval("2025-01-15T10:00:00.000Z", "2025-01-15T09:30:00.000Z")).toThrow(AppError);
	});
});
