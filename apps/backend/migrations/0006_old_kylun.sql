CREATE TABLE "staff_job_titles" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"clinic_id" bigint NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"status" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "staff_job_titles_clinic_id_id_unique" UNIQUE("clinic_id","id"),
	CONSTRAINT "staff_job_titles_clinic_code_unique" UNIQUE("clinic_id","code"),
	CONSTRAINT "staff_job_titles_code_check" CHECK (btrim("staff_job_titles"."code") <> ''),
	CONSTRAINT "staff_job_titles_name_check" CHECK (btrim("staff_job_titles"."name") <> '')
);

CREATE TABLE "staff_profiles" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"clinic_id" bigint NOT NULL,
	"membership_id" bigint NOT NULL,
	"staff_code" varchar(50) NOT NULL,
	"full_name" varchar(150) NOT NULL,
	"phone" varchar(32),
	"date_of_birth" date,
	"gender" varchar(20),
	"address" varchar(500),
	"job_title_id" bigint,
	"specialties" text[] DEFAULT '{}' NOT NULL,
	"employment_status" varchar(20) DEFAULT 'active' NOT NULL,
	"started_at" date,
	"ended_at" date,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "staff_profiles_clinic_id_id_unique" UNIQUE("clinic_id","id"),
	CONSTRAINT "staff_profiles_clinic_membership_unique" UNIQUE("clinic_id","membership_id"),
	CONSTRAINT "staff_profiles_clinic_staff_code_unique" UNIQUE("clinic_id","staff_code"),
	CONSTRAINT "staff_profiles_gender_check" CHECK ("staff_profiles"."gender" is null or "staff_profiles"."gender" in ('male', 'female', 'other', 'unknown')),
	CONSTRAINT "staff_profiles_employment_status_check" CHECK ("staff_profiles"."employment_status" in ('active', 'on_leave', 'terminated')),
	CONSTRAINT "staff_profiles_employment_dates_check" CHECK ("staff_profiles"."started_at" is null or "staff_profiles"."ended_at" is null or "staff_profiles"."ended_at" >= "staff_profiles"."started_at"),
	CONSTRAINT "staff_profiles_staff_code_check" CHECK (btrim("staff_profiles"."staff_code") <> ''),
	CONSTRAINT "staff_profiles_full_name_check" CHECK (btrim("staff_profiles"."full_name") <> '')
);

ALTER TABLE "staff_job_titles" ADD CONSTRAINT "staff_job_titles_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_clinic_membership_fk" FOREIGN KEY ("clinic_id","membership_id") REFERENCES "public"."clinic_memberships"("clinic_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_clinic_job_title_fk" FOREIGN KEY ("clinic_id","job_title_id") REFERENCES "public"."staff_job_titles"("clinic_id","id") ON DELETE no action ON UPDATE no action;
CREATE INDEX "staff_job_titles_clinic_status_idx" ON "staff_job_titles" USING btree ("clinic_id","status");
CREATE INDEX "staff_job_titles_clinic_name_idx" ON "staff_job_titles" USING btree ("clinic_id","name");
CREATE INDEX "staff_profiles_clinic_status_idx" ON "staff_profiles" USING btree ("clinic_id","employment_status");
CREATE INDEX "staff_profiles_clinic_job_title_idx" ON "staff_profiles" USING btree ("clinic_id","job_title_id");
CREATE INDEX "staff_profiles_clinic_full_name_idx" ON "staff_profiles" USING btree ("clinic_id","full_name");
CREATE INDEX "staff_profiles_clinic_staff_code_idx" ON "staff_profiles" USING btree ("clinic_id","staff_code");
CREATE INDEX "staff_profiles_clinic_phone_idx" ON "staff_profiles" USING btree ("clinic_id","phone");