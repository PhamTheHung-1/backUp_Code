import type { App } from "../../App";
import type { OrganizationType } from "./org.schema";
import { orgService } from "./org.service";

export default (app: App) =>
	app.get(
		"",
		async (): Promise<OrganizationType[]> => {
			return orgService.listOrgs();
		},
		{
			detail: {
				summary: "Retun Organziation list",
				tags: ["Organization"],
				authType: 0,
			},
		},
	);
