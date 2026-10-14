import { type TSchema, t } from "elysia";

export function withNumericId<T extends TSchema>(schema: T) {
	const omitted = t.Omit(schema, ["id"]);
	const idObject = t.Object({ id: t.Numeric() });

	return t.Composite([idObject, omitted]) as unknown as ReturnType<typeof t.Composite<[typeof omitted, typeof idObject]>>;
}
