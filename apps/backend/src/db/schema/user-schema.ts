// import { sql } from 'drizzle-orm'
import * as t from "drizzle-orm/pg-core";

import { timestamps } from "../columns-helpers";

export const usersTableSchema = t.pgTable("users", {
	id: t.bigserial({ mode: "number" }).primaryKey(),
	// staffCode: t.varchar("staff_code"),
	// lectureCode: t.varchar("lecture_code"),
	email: t.varchar().unique(),
	username: t.varchar().default(""),
	avatar: t.varchar().default(""),
	status: t.boolean().default(true),
	hpass: t.varchar(),
	salt: t.varchar(),
	roles: t.smallint().array().default([]),
	...timestamps,
});
