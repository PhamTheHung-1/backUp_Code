import { t } from "elysia";

// import { Static } from '@sinclair/typebox';
// import { Value } from '@sinclair/typebox/value';

const envSchema = t.Object({
	PORT: t.Number({ default: 3000 }),
	DB_NAME: t.String(),
	DB_USER: t.String({ default: "postgres" }),
	DB_PASSWORD: t.String({ default: "123" }),
	DB_HOST: t.String({ default: "localhost" }),
	DB_PORT: t.Number({ default: 5432 }),
	DB_URL: t.Optional(t.String()),
	JWT_SECRET: t.String(),
	initDB: t.Boolean({ default: false }),
	nonExportedType: t.Optional(t.String()),
});
type EnvType = typeof envSchema.static;

// export type EnvType = Static<typeof envSchema>;

declare module "bun" {
	interface Env extends EnvType {}
}

// export function validateEnv() {
//     const env = Value.Parse(envSchema, process.env);
//     process.env = { ...process.env, ...env };
// }
