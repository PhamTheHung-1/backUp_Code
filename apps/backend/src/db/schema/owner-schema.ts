import * as t from "drizzle-orm/pg-core";
import { timestamps } from "../columns-helpers";
import { clinics } from "./clinic-schema";

export const owners = t.pgTable(
	"owners",
	{
		id: t.bigserial({ mode: "number" }).primaryKey(),
		clinicId: t
			.bigint("clinic_id", { mode: "number" })
			.notNull()
			.references(() => clinics.id),
		fullName: t.varchar("full_name", { length: 150 }).notNull(),
		phone: t.varchar({ length: 32 }),
		email: t.varchar({ length: 254 }),
		address: t.varchar({ length: 500 }),
		status: t.boolean().notNull().default(true),
		...timestamps,
	},
	table => [
		t.unique("owners_clinic_id_id_unique").on(table.clinicId, table.id),
		t.index("owners_clinic_status_name_idx").on(table.clinicId, table.status, table.fullName),
		t.index("owners_clinic_phone_idx").on(table.clinicId, table.phone),
		t.index("owners_clinic_email_idx").on(table.clinicId, table.email),
	],
);
