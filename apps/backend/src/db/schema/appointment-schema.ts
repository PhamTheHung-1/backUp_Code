import { sql } from "drizzle-orm";
import * as t from "drizzle-orm/pg-core";
import { timestamps } from "../columns-helpers";
import { clinicMemberships } from "./clinic-membership-schema";
import { clinics } from "./clinic-schema";
import { owners } from "./owner-schema";
import { pets } from "./pet-schema";
import { usersTableSchema as users } from "./user-schema";

export const clinicBusinessHours = t.pgTable(
	"clinic_business_hours",
	{
		clinicId: t.bigint("clinic_id", { mode: "number" }).notNull(),
		weekday: t.smallint().notNull(),
		openTime: t.time("open_time").notNull(),
		closeTime: t.time("close_time").notNull(),
		...timestamps,
	},
	table => [
		t.primaryKey({ name: "clinic_business_hours_pk", columns: [table.clinicId, table.weekday] }),
		t.foreignKey({
			name: "clinic_business_hours_clinic_fk",
			columns: [table.clinicId],
			foreignColumns: [clinics.id],
		}),
		t.check("clinic_business_hours_weekday_check", sql`${table.weekday} between 0 and 6`),
		t.check("clinic_business_hours_time_check", sql`${table.openTime} < ${table.closeTime}`),
	],
);

export const appointments = t.pgTable(
	"appointments",
	{
		id: t.bigserial({ mode: "number" }).primaryKey(),
		clinicId: t.bigint("clinic_id", { mode: "number" }).notNull(),
		petId: t.bigint("pet_id", { mode: "number" }).notNull(),
		ownerId: t.bigint("owner_id", { mode: "number" }).notNull(),
		veterinarianId: t.bigint("veterinarian_id", { mode: "number" }),
		startAt: t.timestamp("start_at", { withTimezone: true, mode: "date" }).notNull(),
		endAt: t.timestamp("end_at", { withTimezone: true, mode: "date" }).notNull(),
		status: t.varchar({ length: 16 }).notNull().default("booked"),
		reason: t.varchar({ length: 500 }),
		createdBy: t
			.bigint("created_by", { mode: "number" })
			.notNull()
			.references(() => users.id),
		...timestamps,
	},
	table => [
		t.unique("appointments_clinic_id_id_unique").on(table.clinicId, table.id),
		t.foreignKey({
			name: "appointments_clinic_fk",
			columns: [table.clinicId],
			foreignColumns: [clinics.id],
		}),
		t.foreignKey({
			name: "appointments_clinic_owner_fk",
			columns: [table.clinicId, table.ownerId],
			foreignColumns: [owners.clinicId, owners.id],
		}),
		t.foreignKey({
			name: "appointments_clinic_pet_owner_fk",
			columns: [table.clinicId, table.petId, table.ownerId],
			foreignColumns: [pets.clinicId, pets.id, pets.ownerId],
		}),
		t.foreignKey({
			name: "appointments_clinic_veterinarian_fk",
			columns: [table.clinicId, table.veterinarianId],
			foreignColumns: [clinicMemberships.clinicId, clinicMemberships.userId],
		}),
		t.check("appointments_status_check", sql`${table.status} in ('booked', 'confirmed', 'arrived', 'in_exam', 'completed', 'cancelled', 'no_show')`),
		t.check("appointments_time_check", sql`${table.startAt} < ${table.endAt}`),
		t.index("appointments_clinic_start_idx").on(table.clinicId, table.startAt),
		t.index("appointments_clinic_status_start_idx").on(table.clinicId, table.status, table.startAt),
		t.index("appointments_clinic_veterinarian_start_idx").on(table.clinicId, table.veterinarianId, table.startAt),
		t.index("appointments_clinic_pet_start_idx").on(table.clinicId, table.petId, table.startAt),
	],
);
