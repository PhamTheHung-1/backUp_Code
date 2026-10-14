import * as t from "drizzle-orm/pg-core";
import { timestamps } from "../columns-helpers";

export const roles = t.pgTable("roles", {
	id: t.smallserial().primaryKey(),
	name: t.varchar(),
	desc: t.varchar(),
	status: t.boolean().default(true),
	menus: t.smallint().array().default([]),
	hmenus: t.smallint().array().default([]), //halfCheckKey
	apis: t.bigint({ mode: "number" }).array().default([]),
	...timestamps,
});
