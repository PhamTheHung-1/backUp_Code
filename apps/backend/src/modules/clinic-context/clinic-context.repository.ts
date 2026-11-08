import { db } from "@be/db";
import { clinicMemberships, membershipBranches, membershipRoles } from "@be/db/schema/clinic-membership-schema";
import { branches, clinics } from "@be/db/schema/clinic-schema";
import { roles } from "@be/db/schema/role-schema";
import { and, eq } from "drizzle-orm";
import { userRepository } from "../user/user.repository";

export type ClinicMembershipRecord = {
	membershipId: number;
	clinicId: number;
	clinicName: string;
	clinicStatus: boolean;
	membershipStatus: string;
	branchScope: string;
	roleIds: number[];
	permissions: number[];
};

export const clinicContextRepository = {
	async findUserByEmail(email: string) {
		return userRepository.findIdentityByEmail(email);
	},

	async findMembershipsByUserId(userId: number): Promise<ClinicMembershipRecord[]> {
		const rows = await db
			.select({
				membershipId: clinicMemberships.id,
				clinicId: clinics.id,
				clinicName: clinics.name,
				clinicStatus: clinics.status,
				membershipStatus: clinicMemberships.status,
				branchScope: clinicMemberships.branchScope,
				roleId: roles.id,
				permissions: roles.apis,
			})
			.from(clinicMemberships)
			.innerJoin(clinics, eq(clinicMemberships.clinicId, clinics.id))
			.leftJoin(
				membershipRoles,
				and(eq(membershipRoles.clinicId, clinicMemberships.clinicId), eq(membershipRoles.membershipId, clinicMemberships.id)),
			)
			.leftJoin(roles, and(eq(roles.clinicId, membershipRoles.clinicId), eq(roles.id, membershipRoles.roleId), eq(roles.status, true)))
			.where(eq(clinicMemberships.userId, userId));

		const memberships = new Map<number, ClinicMembershipRecord>();
		for (const row of rows) {
			let membership = memberships.get(row.membershipId);
			if (!membership) {
				membership = {
					membershipId: row.membershipId,
					clinicId: row.clinicId,
					clinicName: row.clinicName,
					clinicStatus: row.clinicStatus,
					membershipStatus: row.membershipStatus,
					branchScope: row.branchScope,
					roleIds: [],
					permissions: [],
				};
				memberships.set(row.membershipId, membership);
			}
			if (row.roleId !== null && !membership.roleIds.includes(row.roleId)) {
				membership.roleIds.push(row.roleId);
			}
			if (row.permissions) {
				for (const permission of row.permissions) {
					if (!membership.permissions.includes(permission)) membership.permissions.push(permission);
				}
			}
		}

		return [...memberships.values()];
	},

	async findMembershipBranchIds(clinicId: number, membershipId: number): Promise<number[]> {
		const rows = await db
			.select({ branchId: membershipBranches.branchId })
			.from(membershipBranches)
			.where(and(eq(membershipBranches.clinicId, clinicId), eq(membershipBranches.membershipId, membershipId)));
		return rows.map(row => row.branchId);
	},

	async findBranchById(branchId: number): Promise<{ clinicId: number; status: boolean } | null> {
		const rows = await db.select({ clinicId: branches.clinicId, status: branches.status }).from(branches).where(eq(branches.id, branchId));
		return rows[0] ?? null;
	},
};

export type ClinicContextRepository = typeof clinicContextRepository;
