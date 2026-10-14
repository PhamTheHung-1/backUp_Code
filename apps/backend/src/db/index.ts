import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
	connectionString: process.env.DB_URL,
	ssl: false, //turn on true for ssl posgres server
});

export const db = drizzle(pool);
