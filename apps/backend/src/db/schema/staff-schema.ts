import { sql } from "drizzle-orm";
import * as t from "drizzle-orm/pg-core";
import { clinicMemberships } from "./clinic-membership-schema";
import { clinics } from "./clinic-schema";

export const staffJobTitles = t.pgTable(
	"staff_job_titles",
	{
		id: t.bigserial({ mode: "number" }).primaryKey(),
		clinicId: t
			.bigint("clinic_id", { mode: "number" })
			.notNull()
			.references(() => clinics.id),
		code: t.varchar({ length: 50 }).notNull(),
		name: t.varchar({ length: 100 }).notNull(),
		status: t.boolean().notNull().default(true),
		createdAt: t.timestamp("created_at").notNull().defaultNow(),
		updatedAt: t
			.timestamp("updated_at")
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	table => [
		t.unique("staff_job_titles_clinic_id_id_unique").on(table.clinicId, table.id),
		t.unique("staff_job_titles_clinic_code_unique").on(table.clinicId, table.code),
		t.check("staff_job_titles_code_check", sql`btrim(${table.code}) <> ''`),
		t.check("staff_job_titles_name_check", sql`btrim(${table.name}) <> ''`),
		t.index("staff_job_titles_clinic_status_idx").on(table.clinicId, table.status),
		t.index("staff_job_titles_clinic_name_idx").on(table.clinicId, table.name),
	],
);

export const staffProfiles = t.pgTable(
	"staff_profiles",
	{
		id: t.bigserial({ mode: "number" }).primaryKey(),
		clinicId: t
			.bigint("clinic_id", { mode: "number" })
			.notNull()
			.references(() => clinics.id),
		membershipId: t.bigint("membership_id", { mode: "number" }).notNull(),
		staffCode: t.varchar("staff_code", { length: 50 }).notNull(),
		fullName: t.varchar("full_name", { length: 150 }).notNull(),
		phone: t.varchar({ length: 32 }),
		dateOfBirth: t.date("date_of_birth"),
		gender: t.varchar({ length: 20 }),
		address: t.varchar({ length: 500 }),
		jobTitleId: t.bigint("job_title_id", { mode: "number" }),
		specialties: t.text().array().notNull().default([]),
		employmentStatus: t.varchar("employment_status", { length: 20 }).notNull().default("active"),
		startedAt: t.date("started_at"),
		endedAt: t.date("ended_at"),
		note: t.text(),
		createdAt: t.timestamp("created_at").notNull().defaultNow(),
		updatedAt: t
			.timestamp("updated_at")
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	table => [
		t.unique("staff_profiles_clinic_id_id_unique").on(table.clinicId, table.id),
		t.unique("staff_profiles_clinic_membership_unique").on(table.clinicId, table.membershipId),
		t.unique("staff_profiles_clinic_staff_code_unique").on(table.clinicId, table.staffCode),
		t.foreignKey({
			name: "staff_profiles_clinic_membership_fk",
			columns: [table.clinicId, table.membershipId],
			foreignColumns: [clinicMemberships.clinicId, clinicMemberships.id],
		}),
		t.foreignKey({
			name: "staff_profiles_clinic_job_title_fk",
			columns: [table.clinicId, table.jobTitleId],
			foreignColumns: [staffJobTitles.clinicId, staffJobTitles.id],
		}),
		t.check("staff_profiles_gender_check", sql`${table.gender} is null or ${table.gender} in ('male', 'female', 'other', 'unknown')`),
		t.check(
			"staff_profiles_employment_status_check",
			sql`${table.employmentStatus} in ('active', 'on_leave', 'terminated')`,
		),
		t.check(
			"staff_profiles_employment_dates_check",
			sql`${table.startedAt} is null or ${table.endedAt} is null or ${table.endedAt} >= ${table.startedAt}`,
		),
		t.check("staff_profiles_staff_code_check", sql`btrim(${table.staffCode}) <> ''`),
		t.check("staff_profiles_full_name_check", sql`btrim(${table.fullName}) <> ''`),
		t.index("staff_profiles_clinic_status_idx").on(table.clinicId, table.employmentStatus),
		t.index("staff_profiles_clinic_job_title_idx").on(table.clinicId, table.jobTitleId),
		t.index("staff_profiles_clinic_full_name_idx").on(table.clinicId, table.fullName),
		t.index("staff_profiles_clinic_staff_code_idx").on(table.clinicId, table.staffCode),
		t.index("staff_profiles_clinic_phone_idx").on(table.clinicId, table.phone),
	],
);
