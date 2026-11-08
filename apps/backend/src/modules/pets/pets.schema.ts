import { pets } from "@be/db/schema/pet-schema";
import { createSelectSchema } from "drizzle-typebox";
import { t } from "elysia";

export const petSelectSchema = createSelectSchema(pets);
export type Pet = typeof petSelectSchema.static;

export const petCreateSchema = t.Object(
	{
		ownerId: t.Numeric({ minimum: 1 }),
		name: t.String({ minLength: 1, maxLength: 150, pattern: "\\S" }),
		species: t.String({ minLength: 1, maxLength: 80, pattern: "\\S" }),
		sex: t.Optional(t.Union([t.Literal("male"), t.Literal("female"), t.Literal("unknown")])),
		breed: t.Optional(t.String({ maxLength: 120 })),
		dateOfBirth: t.Optional(t.String({ format: "date" })),
		color: t.Optional(t.String({ maxLength: 80 })),
		microchipNumber: t.Optional(t.String({ maxLength: 64 })),
	},
	{ additionalProperties: false },
);
export type PetCreate = typeof petCreateSchema.static;

export const petUpdateSchema = t.Object(
	{
		ownerId: t.Optional(t.Numeric({ minimum: 1 })),
		name: t.Optional(t.String({ minLength: 1, maxLength: 150, pattern: "\\S" })),
		species: t.Optional(t.String({ minLength: 1, maxLength: 80, pattern: "\\S" })),
		sex: t.Optional(t.Union([t.Literal("male"), t.Literal("female"), t.Literal("unknown")])),
		breed: t.Optional(t.String({ maxLength: 120 })),
		dateOfBirth: t.Optional(t.String({ format: "date" })),
		color: t.Optional(t.String({ maxLength: 80 })),
		microchipNumber: t.Optional(t.String({ maxLength: 64 })),
		status: t.Optional(t.Boolean()),
	},
	{ additionalProperties: false },
);
export type PetUpdate = typeof petUpdateSchema.static;

export const petListResponseSchema = t.Object({
	items: t.Array(t.Intersect([petSelectSchema, t.Object({ ownerName: t.String(), ownerPhone: t.Union([t.String(), t.Null()]), })])),
	page: t.Number(),
	pageSize: t.Number(),
	total: t.Number(),
});

export { pets };
