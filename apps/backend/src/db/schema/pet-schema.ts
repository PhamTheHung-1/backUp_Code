import { sql } from "drizzle-orm";
import * as t from "drizzle-orm/pg-core";
import { timestamps } from "../columns-helpers";
import { clinics } from "./clinic-schema";
import { owners } from "./owner-schema";

export const petCodeCounters = t.pgTable(
	"pet_code_counters",
	{
		clinicId: t.bigint("clinic_id", { mode: "number" }).notNull(),
		prefix: t.varchar({ length: 1 }).notNull(),
		lastNumber: t.integer("last_number").notNull().default(0),
	},
	table => [
		t.primaryKey({ name: "pet_code_counters_pk", columns: [table.clinicId, table.prefix] }),
		t.foreignKey({
			name: "pet_code_counters_clinic_fk",
			columns: [table.clinicId],
			foreignColumns: [clinics.id],
		}),
		t.check("pet_code_counters_prefix_check", sql`${table.prefix} ~ '^[A-Z]$'`),
		t.check("pet_code_counters_last_number_check", sql`${table.lastNumber} >= 0`),
	],
);

export const pets = t.pgTable(
	"pets",
	{
		id: t.bigserial({ mode: "number" }).primaryKey(),
		clinicId: t.bigint("clinic_id", { mode: "number" }).notNull(),
		petCode: t.varchar("pet_code", { length: 32 }).notNull(),
		ownerId: t.bigint("owner_id", { mode: "number" }).notNull(),
		name: t.varchar({ length: 150 }).notNull(),
		species: t.varchar({ length: 80 }).notNull(),
		sex: t.varchar({ length: 16 }).notNull().default("unknown"),
		breed: t.varchar({ length: 120 }),
		dateOfBirth: t.date("date_of_birth"),
		color: t.varchar({ length: 80 }),
		microchipNumber: t.varchar("microchip_number", { length: 64 }),
		status: t.boolean().notNull().default(true),
		...timestamps,
	},
	table => [
		t.unique("pets_clinic_id_id_unique").on(table.clinicId, table.id),
		t.unique("pets_clinic_id_id_owner_id_unique").on(table.clinicId, table.id, table.ownerId),
		t.unique("pets_clinic_id_pet_code_unique").on(table.clinicId, table.petCode),
		t.foreignKey({
			name: "pets_clinic_owner_fk",
			columns: [table.clinicId, table.ownerId],
			foreignColumns: [owners.clinicId, owners.id],
		}),
		t.foreignKey({
			name: "pets_clinic_fk",
			columns: [table.clinicId],
			foreignColumns: [clinics.id],
		}),
		t.check("pets_sex_check", sql`${table.sex} in ('male', 'female', 'unknown')`),
		t.index("pets_clinic_status_name_idx").on(table.clinicId, table.status, table.name),
		t.index("pets_clinic_owner_idx").on(table.clinicId, table.ownerId),
		t.index("pets_clinic_species_idx").on(table.clinicId, table.species),
		t.index("pets_clinic_sex_status_idx").on(table.clinicId, table.sex, table.status),
		t.index("pets_clinic_microchip_idx").on(table.clinicId, table.microchipNumber),
	],
);
