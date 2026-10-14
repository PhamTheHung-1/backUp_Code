import { type OrgRepository, orgRepository } from "./org.repository";

export function createOrgService(orgRepo: OrgRepository = orgRepository) {
	return {
		async listOrgs() {
			return orgRepo.findAll();
		},
	};
}

export const orgService = createOrgService();
export type OrgService = ReturnType<typeof createOrgService>;
