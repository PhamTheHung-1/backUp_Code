// import type { Treaty } from "@elysiajs/eden";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { InferReqBodyType, InferResType } from "packages/type-utils";
import { treatyClient, unwrap } from "./apiClient";

// export type RoleList = Treaty.Data<typeof treatyClient.api.role.get>;
export type RoleList = InferResType<typeof treatyClient.api.role.get>;

export const useRolesQuery = () => {
	return useQuery<RoleList, unknown>({
		queryKey: ["roles"],
		queryFn: async () => unwrap(treatyClient.api.role.get()),
	});
};

export type CreateRoleType = NonNullable<InferReqBodyType<typeof treatyClient.api.role.post>>;

export const useRoleMutation = () => {
	return useMutation({
		mutationFn: async (role: CreateRoleType) => {
			if (role?.id) {
				return treatyClient.api.role.put(role as InferReqBodyType<typeof treatyClient.api.role.put>);
			}

			return treatyClient.api.role.post(role);
		},
	});
};

export const useApiList = () => {
	return useQuery({
		queryKey: ["api-list"],
		queryFn: () => unwrap(treatyClient.__apis__.get()),
	});
};
