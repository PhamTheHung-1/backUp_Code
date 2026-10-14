import { useQuery } from "@tanstack/react-query";
import type { InferResType } from "packages/type-utils";
import { treatyClient, unwrap } from "./apiClient";

export type Organization = InferResType<typeof treatyClient.api.org.get>[number];

export const useOrgQuery = () => {
	return useQuery({
		queryKey: ["orgs", "list"],
		queryFn: async () => {
			const orgs = await unwrap(treatyClient.api.org.get());
			return orgs;
		},
		staleTime: Number.POSITIVE_INFINITY,
	});
};
