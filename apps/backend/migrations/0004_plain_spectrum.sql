CREATE TABLE "appointments" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"clinic_id" bigint NOT NULL,
	"pet_id" bigint NOT NULL,
	"owner_id" bigint NOT NULL,
	"veterinarian_id" bigint,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"status" varchar(16) DEFAULT 'booked' NOT NULL,
	"reason" varchar(500),
	"created_by" bigint NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "appointments_clinic_id_id_unique" UNIQUE("clinic_id","id"),
	CONSTRAINT "appointments_status_check" CHECK ("appointments"."status" in ('booked', 'confirmed', 'arrived', 'in_exam', 'completed', 'cancelled', 'no_show')),
	CONSTRAINT "appointments_time_check" CHECK ("appointments"."start_at" < "appointments"."end_at")
);

CREATE TABLE "clinic_business_hours" (
	"clinic_id" bigint NOT NULL,
	"weekday" smallint NOT NULL,
	"open_time" time NOT NULL,
	"close_time" time NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "clinic_business_hours_pk" PRIMARY KEY("clinic_id","weekday"),
	CONSTRAINT "clinic_business_hours_weekday_check" CHECK ("clinic_business_hours"."weekday" between 0 and 6),
	CONSTRAINT "clinic_business_hours_time_check" CHECK ("clinic_business_hours"."open_time" < "clinic_business_hours"."close_time")
);

ALTER TABLE "appointments" ADD CONSTRAINT "appointments_clinic_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "pets" ADD CONSTRAINT "pets_clinic_id_id_owner_id_unique" UNIQUE("clinic_id","id","owner_id");
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_clinic_owner_fk" FOREIGN KEY ("clinic_id","owner_id") REFERENCES "public"."owners"("clinic_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_clinic_pet_owner_fk" FOREIGN KEY ("clinic_id","pet_id","owner_id") REFERENCES "public"."pets"("clinic_id","id","owner_id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_clinic_veterinarian_fk" FOREIGN KEY ("clinic_id","veterinarian_id") REFERENCES "public"."clinic_memberships"("clinic_id","user_id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "clinic_business_hours" ADD CONSTRAINT "clinic_business_hours_clinic_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE no action ON UPDATE no action;
CREATE INDEX "appointments_clinic_start_idx" ON "appointments" USING btree ("clinic_id","start_at");
CREATE INDEX "appointments_clinic_status_start_idx" ON "appointments" USING btree ("clinic_id","status","start_at");
CREATE INDEX "appointments_clinic_veterinarian_start_idx" ON "appointments" USING btree ("clinic_id","veterinarian_id","start_at");
CREATE INDEX "appointments_clinic_pet_start_idx" ON "appointments" USING btree ("clinic_id","pet_id","start_at");