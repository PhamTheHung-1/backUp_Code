import * as t from "drizzle-orm/pg-core";
import { timestamps } from "../columns-helpers";
import { clinics } from "./clinic-schema";

export const roles = t.pgTable(
	"roles",
	{
		id: t.smallserial().primaryKey(),
		clinicId: t
			.bigint("clinic_id", { mode: "number" })
			.notNull()
			.references(() => clinics.id),
		name: t.varchar(),
		desc: t.varchar(),
		status: t.boolean().default(true),
		menus: t.smallint().array().default([]),
		hmenus: t.smallint().array().default([]), //halfCheckKey
		apis: t.bigint({ mode: "number" }).array().default([]),
		...timestamps,
	},
	table => [
		t.unique("roles_clinic_id_id_unique").on(table.clinicId, table.id),
		t.index("roles_clinic_id_status_idx").on(table.clinicId, table.status),
	],
);
