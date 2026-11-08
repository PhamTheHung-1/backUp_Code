import { sql } from "drizzle-orm";
import * as t from "drizzle-orm/pg-core";
import { timestamps } from "../columns-helpers";
import { branches, clinics } from "./clinic-schema";
import { roles } from "./role-schema";
import { usersTableSchema as users } from "./user-schema";

export const clinicMemberships = t.pgTable(
	"clinic_memberships",
	{
		id: t.bigserial({ mode: "number" }).primaryKey(),
		clinicId: t
			.bigint("clinic_id", { mode: "number" })
			.notNull()
			.references(() => clinics.id),
		userId: t
			.bigint("user_id", { mode: "number" })
			.notNull()
			.references(() => users.id),
		status: t.varchar().notNull().default("active"),
		branchScope: t.varchar("branch_scope").notNull().default("assigned"),
		invitedBy: t.bigint("invited_by", { mode: "number" }).references(() => users.id, { onDelete: "set null" }),
		joinedAt: t.timestamp("joined_at"),
		...timestamps,
	},
	table => [
		t.unique("clinic_memberships_clinic_user_unique").on(table.clinicId, table.userId),
		t.unique("clinic_memberships_clinic_id_id_unique").on(table.clinicId, table.id),
		t.index("clinic_memberships_user_status_idx").on(table.userId, table.status),
		t.index("clinic_memberships_clinic_status_idx").on(table.clinicId, table.status),
		t.check("clinic_memberships_status_check", sql`${table.status} in ('invited', 'active', 'suspended', 'removed')`),
		t.check("clinic_memberships_branch_scope_check", sql`${table.branchScope} in ('all', 'assigned')`),
	],
);

export const membershipRoles = t.pgTable(
	"membership_roles",
	{
		clinicId: t.bigint("clinic_id", { mode: "number" }).notNull(),
		membershipId: t.bigint("membership_id", { mode: "number" }).notNull(),
		roleId: t.smallint("role_id").notNull(),
		createdAt: t.timestamp("created_at").notNull().defaultNow(),
	},
	table => [
		t.primaryKey({
			name: "membership_roles_pk",
			columns: [table.clinicId, table.membershipId, table.roleId],
		}),
		t.foreignKey({
			name: "membership_roles_membership_fk",
			columns: [table.clinicId, table.membershipId],
			foreignColumns: [clinicMemberships.clinicId, clinicMemberships.id],
		}),
		t.foreignKey({
			name: "membership_roles_role_fk",
			columns: [table.clinicId, table.roleId],
			foreignColumns: [roles.clinicId, roles.id],
		}),
		t.index("membership_roles_clinic_role_idx").on(table.clinicId, table.roleId),
	],
);

export const membershipBranches = t.pgTable(
	"membership_branches",
	{
		clinicId: t.bigint("clinic_id", { mode: "number" }).notNull(),
		membershipId: t.bigint("membership_id", { mode: "number" }).notNull(),
		branchId: t.bigint("branch_id", { mode: "number" }).notNull(),
		createdAt: t.timestamp("created_at").notNull().defaultNow(),
	},
	table => [
		t.primaryKey({
			name: "membership_branches_pk",
			columns: [table.clinicId, table.membershipId, table.branchId],
		}),
		t.foreignKey({
			name: "membership_branches_membership_fk",
			columns: [table.clinicId, table.membershipId],
			foreignColumns: [clinicMemberships.clinicId, clinicMemberships.id],
		}),
		t.foreignKey({
			name: "membership_branches_branch_fk",
			columns: [table.clinicId, table.branchId],
			foreignColumns: [branches.clinicId, branches.id],
		}),
		t.index("membership_branches_clinic_branch_idx").on(table.clinicId, table.branchId),
	],
);
