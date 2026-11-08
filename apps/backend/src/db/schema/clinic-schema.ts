import * as t from "drizzle-orm/pg-core";
import { timestamps } from "../columns-helpers";

export const clinics = t.pgTable(
	"clinics",
	{
		id: t.bigserial({ mode: "number" }).primaryKey(),
		name: t.varchar().notNull(),
		slug: t.varchar().notNull(),
		status: t.boolean().notNull().default(true),
		timezone: t.varchar().notNull().default("UTC"),
		phone: t.varchar(),
		email: t.varchar(),
		address: t.varchar(),
		...timestamps,
	},
	table => [t.unique("clinics_slug_unique").on(table.slug)],
);

export const branches = t.pgTable(
	"branches",
	{
		id: t.bigserial({ mode: "number" }).primaryKey(),
		clinicId: t
			.bigint("clinic_id", { mode: "number" })
			.notNull()
			.references(() => clinics.id),
		code: t.varchar().notNull(),
		name: t.varchar().notNull(),
		status: t.boolean().notNull().default(true),
		timezone: t.varchar().notNull().default("UTC"),
		phone: t.varchar(),
		address: t.varchar(),
		...timestamps,
	},
	table => [
		t.unique("branches_clinic_id_code_unique").on(table.clinicId, table.code),
		t.unique("branches_clinic_id_id_unique").on(table.clinicId, table.id),
		t.index("branches_clinic_id_status_idx").on(table.clinicId, table.status),
	],
);
