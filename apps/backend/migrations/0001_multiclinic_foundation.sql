CREATE TABLE "clinic_memberships" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"clinic_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"status" varchar DEFAULT 'active' NOT NULL,
	"branch_scope" varchar DEFAULT 'assigned' NOT NULL,
	"invited_by" bigint,
	"joined_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "clinic_memberships_clinic_user_unique" UNIQUE("clinic_id","user_id"),
	CONSTRAINT "clinic_memberships_clinic_id_id_unique" UNIQUE("clinic_id","id"),
	CONSTRAINT "clinic_memberships_status_check" CHECK ("clinic_memberships"."status" in ('invited', 'active', 'suspended', 'removed')),
	CONSTRAINT "clinic_memberships_branch_scope_check" CHECK ("clinic_memberships"."branch_scope" in ('all', 'assigned'))
);

CREATE TABLE "membership_branches" (
	"clinic_id" bigint NOT NULL,
	"membership_id" bigint NOT NULL,
	"branch_id" bigint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "membership_branches_pk" PRIMARY KEY("clinic_id","membership_id","branch_id")
);

CREATE TABLE "membership_roles" (
	"clinic_id" bigint NOT NULL,
	"membership_id" bigint NOT NULL,
	"role_id" smallint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "membership_roles_pk" PRIMARY KEY("clinic_id","membership_id","role_id")
);

CREATE TABLE "branches" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"clinic_id" bigint NOT NULL,
	"code" varchar NOT NULL,
	"name" varchar NOT NULL,
	"status" boolean DEFAULT true NOT NULL,
	"timezone" varchar DEFAULT 'UTC' NOT NULL,
	"phone" varchar,
	"address" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "branches_clinic_id_code_unique" UNIQUE("clinic_id","code"),
	CONSTRAINT "branches_clinic_id_id_unique" UNIQUE("clinic_id","id")
);

CREATE TABLE "clinics" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"status" boolean DEFAULT true NOT NULL,
	"timezone" varchar DEFAULT 'UTC' NOT NULL,
	"phone" varchar,
	"email" varchar,
	"address" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "clinics_slug_unique" UNIQUE("slug")
);

ALTER TABLE "roles" ADD COLUMN "clinic_id" bigint;

INSERT INTO "clinics" ("name", "slug", "status", "timezone")
VALUES ('Legacy Clinic', 'legacy-clinic', true, 'UTC');

INSERT INTO "branches" ("clinic_id", "code", "name", "status", "timezone")
SELECT "id", 'LEGACY', 'Legacy Branch', true, "timezone"
FROM "clinics"
WHERE "slug" = 'legacy-clinic';

UPDATE "roles"
SET "clinic_id" = (
	SELECT "id"
	FROM "clinics"
	WHERE "slug" = 'legacy-clinic'
);

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM "users" AS u
		CROSS JOIN LATERAL unnest(COALESCE(u."roles", ARRAY[]::smallint[])) AS assigned_role(role_id)
		LEFT JOIN "roles" AS r ON r."id" = assigned_role.role_id
		WHERE r."id" IS NULL
	) THEN
		RAISE EXCEPTION 'Cannot migrate clinic memberships: users.roles contains role IDs that do not exist';
	END IF;
END;
$$;

INSERT INTO "clinic_memberships" (
	"clinic_id",
	"user_id",
	"status",
	"branch_scope",
	"joined_at"
)
SELECT
	c."id",
	u."id",
	CASE WHEN u."status" IS FALSE THEN 'suspended' ELSE 'active' END,
	'all',
	COALESCE(u."created_at", now())
FROM "users" AS u
CROSS JOIN "clinics" AS c
WHERE c."slug" = 'legacy-clinic';

INSERT INTO "membership_roles" ("clinic_id", "membership_id", "role_id")
SELECT DISTINCT
	m."clinic_id",
	m."id",
	assigned_role.role_id
FROM "clinic_memberships" AS m
JOIN "users" AS u ON u."id" = m."user_id"
CROSS JOIN LATERAL unnest(COALESCE(u."roles", ARRAY[]::smallint[])) AS assigned_role(role_id)
WHERE m."clinic_id" = (
	SELECT "id"
	FROM "clinics"
	WHERE "slug" = 'legacy-clinic'
);

ALTER TABLE "roles" ALTER COLUMN "clinic_id" SET NOT NULL;
ALTER TABLE "roles" ADD CONSTRAINT "roles_clinic_id_id_unique" UNIQUE("clinic_id","id");
ALTER TABLE "roles" ADD CONSTRAINT "roles_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "clinic_memberships" ADD CONSTRAINT "clinic_memberships_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "clinic_memberships" ADD CONSTRAINT "clinic_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "clinic_memberships" ADD CONSTRAINT "clinic_memberships_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "membership_branches" ADD CONSTRAINT "membership_branches_membership_fk" FOREIGN KEY ("clinic_id","membership_id") REFERENCES "public"."clinic_memberships"("clinic_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "membership_branches" ADD CONSTRAINT "membership_branches_branch_fk" FOREIGN KEY ("clinic_id","branch_id") REFERENCES "public"."branches"("clinic_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "membership_roles" ADD CONSTRAINT "membership_roles_membership_fk" FOREIGN KEY ("clinic_id","membership_id") REFERENCES "public"."clinic_memberships"("clinic_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "membership_roles" ADD CONSTRAINT "membership_roles_role_fk" FOREIGN KEY ("clinic_id","role_id") REFERENCES "public"."roles"("clinic_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "branches" ADD CONSTRAINT "branches_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE no action ON UPDATE no action;
CREATE INDEX "clinic_memberships_user_status_idx" ON "clinic_memberships" USING btree ("user_id","status");
CREATE INDEX "clinic_memberships_clinic_status_idx" ON "clinic_memberships" USING btree ("clinic_id","status");
CREATE INDEX "membership_branches_clinic_branch_idx" ON "membership_branches" USING btree ("clinic_id","branch_id");
CREATE INDEX "membership_roles_clinic_role_idx" ON "membership_roles" USING btree ("clinic_id","role_id");
CREATE INDEX "branches_clinic_id_status_idx" ON "branches" USING btree ("clinic_id","status");
CREATE INDEX "roles_clinic_id_status_idx" ON "roles" USING btree ("clinic_id","status");