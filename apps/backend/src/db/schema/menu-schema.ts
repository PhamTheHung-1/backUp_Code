import * as t from "drizzle-orm/pg-core";
import { timestamps } from "../columns-helpers";

// export const menuTypeEnum = t.pgEnum("menuType", ["CATALOGUE", "MENU"]);

export const menus = t.pgTable("menus", {
	// https://github.com/drizzle-team/drizzle-orm/issues/4724
	// Using generatedByDefaultAsIdentity() instead of generatedAlwaysAsIdentity() seems to generate the types and schemas exactly as intended (Select schema has id, Insert and Update schema has optional id).
	id: t.smallint().generatedByDefaultAsIdentity().primaryKey(),
	parentId: t.smallint("parent_id").references((): t.AnyPgColumn => menus.id),
	name: t.varchar().notNull(),
	label: t.varchar().notNull(),
	type: t.smallint().notNull(), //0,1,2 <=>"CATALOGUE", "MENU", "BUTTON"
	route: t.varchar(),
	icon: t.varchar(),
	active: t.boolean().default(true),
	order: t.smallint(),
	component: t.varchar(),
	hide: t.boolean().default(false),
	hideTab: t.boolean().default(false),
	frameSrc: t.varchar(),
	newFeature: t.boolean().default(false),
	...timestamps,
});
