CREATE TABLE "pet_code_counters" (
	"clinic_id" bigint NOT NULL,
	"prefix" varchar(1) NOT NULL,
	"last_number" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "pet_code_counters_pk" PRIMARY KEY("clinic_id","prefix"),
	CONSTRAINT "pet_code_counters_prefix_check" CHECK ("pet_code_counters"."prefix" ~ '^[A-Z]$'),
	CONSTRAINT "pet_code_counters_last_number_check" CHECK ("pet_code_counters"."last_number" >= 0)
);

ALTER TABLE "pets" ADD COLUMN "pet_code" varchar(32);

WITH pet_prefixes AS (
	SELECT
		"id",
		"clinic_id",
		CASE
			WHEN lower(btrim("species")) IN ('dog', 'chó') THEN 'D'
			WHEN lower(btrim("species")) IN ('cat', 'mèo') THEN 'C'
			WHEN lower(btrim("species")) IN ('rabbit', 'thỏ') THEN 'R'
			WHEN lower(btrim("species")) IN ('bird', 'chim') THEN 'B'
			WHEN lower(btrim("species")) IN ('fish', 'cá') THEN 'F'
			WHEN lower(btrim("species")) IN ('turtle', 'rùa') THEN 'T'
			WHEN lower(btrim("species")) = 'hamster' THEN 'H'
			WHEN lower(btrim("species")) IN ('guinea pig', 'bọ ú') THEN 'G'
			WHEN btrim("species") ~ '^[A-Za-z]' THEN upper(left(btrim("species"), 1))
			ELSE 'P'
		END AS "prefix"
	FROM "pets"
), numbered_pets AS (
	SELECT
		"id",
		"clinic_id",
		"prefix",
		row_number() OVER (PARTITION BY "clinic_id", "prefix" ORDER BY "id") AS "sequence"
	FROM pet_prefixes
)
UPDATE "pets" AS pet
SET "pet_code" = numbered_pets."prefix" || lpad(numbered_pets."sequence"::text, 2, '0')
FROM numbered_pets
WHERE pet."id" = numbered_pets."id";

INSERT INTO "pet_code_counters" ("clinic_id", "prefix", "last_number")
SELECT
	"clinic_id",
	left("pet_code", 1),
	max(substring("pet_code" FROM 2)::integer)
FROM "pets"
GROUP BY "clinic_id", left("pet_code", 1);

ALTER TABLE "pets" ALTER COLUMN "pet_code" SET NOT NULL;
ALTER TABLE "pet_code_counters" ADD CONSTRAINT "pet_code_counters_clinic_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "pets" ADD CONSTRAINT "pets_clinic_id_pet_code_unique" UNIQUE("clinic_id","pet_code");