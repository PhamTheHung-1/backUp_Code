import { appointments, clinicBusinessHours } from "@be/db/schema/appointment-schema";
import { createSelectSchema } from "drizzle-typebox";
import { t } from "elysia";

export const appointmentSelectSchema = createSelectSchema(appointments);
export type Appointment = typeof appointmentSelectSchema.static;
export const appointmentResponseSchema = t.Composite([
	t.Omit(appointmentSelectSchema, ["startAt", "endAt", "createdAt", "updatedAt"]),
	t.Object({
		startAt: t.String({ format: "date-time" }),
		endAt: t.String({ format: "date-time" }),
		createdAt: t.Union([t.String({ format: "date-time" }), t.Null()]),
		updatedAt: t.Union([t.String({ format: "date-time" }), t.Null()]),
	}),
]);

const appointmentInputFields = {
	petId: t.Numeric({ minimum: 1 }),
	veterinarianId: t.Optional(t.Nullable(t.Numeric({ minimum: 1 }))),
	startAt: t.String({ format: "date-time" }),
	endAt: t.String({ format: "date-time" }),
	reason: t.Optional(t.Nullable(t.String({ maxLength: 500 }))),
};

export const appointmentCreateSchema = t.Object(appointmentInputFields, { additionalProperties: false });
export type AppointmentCreate = typeof appointmentCreateSchema.static;

export const appointmentUpdateSchema = t.Object(
	{
		petId: t.Optional(t.Numeric({ minimum: 1 })),
		veterinarianId: t.Optional(t.Nullable(t.Numeric({ minimum: 1 }))),
		startAt: t.Optional(t.String({ format: "date-time" })),
		endAt: t.Optional(t.String({ format: "date-time" })),
		reason: t.Optional(t.Nullable(t.String({ maxLength: 500 }))),
	},
	{ additionalProperties: false },
);
export type AppointmentUpdate = typeof appointmentUpdateSchema.static;

export const appointmentQuerySchema = t.Object({
	page: t.Optional(t.Numeric({ minimum: 1, multipleOf: 1 })),
	pageSize: t.Optional(t.Numeric({ minimum: 1, maximum: 100, multipleOf: 1 })),
	from: t.Optional(t.String({ format: "date-time" })),
	to: t.Optional(t.String({ format: "date-time" })),
	status: t.Optional(
		t.Union([
			t.Literal("booked"),
			t.Literal("confirmed"),
			t.Literal("arrived"),
			t.Literal("in_exam"),
			t.Literal("completed"),
			t.Literal("cancelled"),
			t.Literal("no_show"),
		]),
	),
	veterinarianId: t.Optional(t.Numeric({ minimum: 1 })),
});

export const appointmentListResponseSchema = t.Object({
	items: t.Array(
		t.Intersect([
			appointmentResponseSchema,
			t.Object({
				petName: t.String(),
				petCode: t.String(),
				ownerName: t.String(),
				ownerPhone: t.Union([t.String(), t.Null()]),
				veterinarianName: t.Union([t.String(), t.Null()]),
			}),
		]),
	),
	page: t.Number(),
	pageSize: t.Number(),
	total: t.Number(),
});

export const appointmentDetailResponseSchema = t.Intersect([
	appointmentResponseSchema,
	t.Object({
		petName: t.String(),
		petCode: t.String(),
		ownerName: t.String(),
		ownerPhone: t.Union([t.String(), t.Null()]),
		veterinarianName: t.Union([t.String(), t.Null()]),
	}),
]);

export const appointmentHoursSchema = t.Object({
	days: t.Array(
		t.Object(
			{
				weekday: t.Integer({ minimum: 0, maximum: 6 }),
				openTime: t.String({ pattern: "^([01]\\d|2[0-3]):[0-5]\\d$" }),
				closeTime: t.String({ pattern: "^([01]\\d|2[0-3]):[0-5]\\d$" }),
			},
			{ additionalProperties: false },
		),
		{ maxItems: 7 },
	),
});

export const clinicBusinessHourSelectSchema = createSelectSchema(clinicBusinessHours);

export const availableSlotsQuerySchema = t.Object({
	date: t.String({ format: "date" }),
	durationMinutes: t.Numeric({ minimum: 5, maximum: 480, multipleOf: 5 }),
	veterinarianId: t.Optional(t.Numeric({ minimum: 1 })),
});

export const availableSlotsResponseSchema = t.Object({
	date: t.String(),
	durationMinutes: t.Number(),
	timezone: t.String(),
	slots: t.Array(
		t.Object({
			veterinarianId: t.Number(),
			veterinarianName: t.String(),
			startAt: t.String({ format: "date-time" }),
			endAt: t.String({ format: "date-time" }),
		}),
	),
});

export const dailyQueueQuerySchema = t.Object({
	date: t.String({ format: "date" }),
});

export const dailyQueueResponseSchema = t.Object({
	date: t.String(),
	timezone: t.String(),
	items: t.Array(
		t.Intersect([
			appointmentResponseSchema,
			t.Object({
				petName: t.String(),
				petCode: t.String(),
				ownerName: t.String(),
				ownerPhone: t.Union([t.String(), t.Null()]),
				veterinarianName: t.Union([t.String(), t.Null()]),
			}),
		]),
	),
});
