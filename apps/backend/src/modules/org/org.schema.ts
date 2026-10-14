import { type Static, t } from "elysia";

export const orgSchema = t.Recursive(This =>
	t.Object({
		id: t.String(),
		name: t.String(),
		status: t.String(),
		desc: t.Optional(t.String()),
		order: t.Optional(t.Number()),
		children: t.Optional(t.Array(This)),
	}),
);

export type OrganizationType = Static<typeof orgSchema>;
