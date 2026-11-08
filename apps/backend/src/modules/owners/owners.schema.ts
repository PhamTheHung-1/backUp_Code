import { owners } from "@be/db/schema/owner-schema";
import { createSelectSchema } from "drizzle-typebox";
import { t } from "elysia";

export const ownerSelectSchema = createSelectSchema(owners);
export type Owner = typeof ownerSelectSchema.static;

export const ownerCreateSchema = t.Object(
	{
		fullName: t.String({ minLength: 1, maxLength: 150, pattern: "\\S" }),
		phone: t.Optional(t.String({ maxLength: 32 })),
		email: t.Optional(t.String({ format: "email", maxLength: 254 })),
		address: t.Optional(t.String({ maxLength: 500 })),
	},
	{ additionalProperties: false },
);
export type OwnerCreate = typeof ownerCreateSchema.static;

export const ownerUpdateSchema = t.Object(
	{
		fullName: t.Optional(t.String({ minLength: 1, maxLength: 150, pattern: "\\S" })),
		phone: t.Optional(t.String({ maxLength: 32 })),
		email: t.Optional(t.String({ format: "email", maxLength: 254 })),
		address: t.Optional(t.String({ maxLength: 500 })),
		status: t.Optional(t.Boolean()),
	},
	{ additionalProperties: false },
);
export type OwnerUpdate = typeof ownerUpdateSchema.static;

export const ownerListResponseSchema = t.Object({
	items: t.Array(ownerSelectSchema),
	page: t.Number(),
	pageSize: t.Number(),
	total: t.Number(),
});

export { owners };
