CREATE TABLE "owners" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"clinic_id" bigint NOT NULL,
	"full_name" varchar(150) NOT NULL,
	"phone" varchar(32),
	"email" varchar(254),
	"address" varchar(500),
	"status" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "owners_clinic_id_id_unique" UNIQUE("clinic_id","id")
);

CREATE TABLE "pets" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"clinic_id" bigint NOT NULL,
	"owner_id" bigint NOT NULL,
	"name" varchar(150) NOT NULL,
	"species" varchar(80) NOT NULL,
	"sex" varchar(16) DEFAULT 'unknown' NOT NULL,
	"breed" varchar(120),
	"date_of_birth" date,
	"color" varchar(80),
	"microchip_number" varchar(64),
	"status" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "pets_clinic_id_id_unique" UNIQUE("clinic_id","id"),
	CONSTRAINT "pets_sex_check" CHECK ("pets"."sex" in ('male', 'female', 'unknown'))
);

ALTER TABLE "owners" ADD CONSTRAINT "owners_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "pets" ADD CONSTRAINT "pets_clinic_owner_fk" FOREIGN KEY ("clinic_id","owner_id") REFERENCES "public"."owners"("clinic_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "pets" ADD CONSTRAINT "pets_clinic_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE no action ON UPDATE no action;
CREATE INDEX "owners_clinic_status_name_idx" ON "owners" USING btree ("clinic_id","status","full_name");
CREATE INDEX "owners_clinic_phone_idx" ON "owners" USING btree ("clinic_id","phone");
CREATE INDEX "owners_clinic_email_idx" ON "owners" USING btree ("clinic_id","email");
CREATE INDEX "pets_clinic_status_name_idx" ON "pets" USING btree ("clinic_id","status","name");
CREATE INDEX "pets_clinic_owner_idx" ON "pets" USING btree ("clinic_id","owner_id");
CREATE INDEX "pets_clinic_species_idx" ON "pets" USING btree ("clinic_id","species");
CREATE INDEX "pets_clinic_sex_status_idx" ON "pets" USING btree ("clinic_id","sex","status");
CREATE INDEX "pets_clinic_microchip_idx" ON "pets" USING btree ("clinic_id","microchip_number");