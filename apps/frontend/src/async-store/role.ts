// import type { Treaty } from "@elysiajs/eden";

import useClinicStore from "@fe/store/clinicStore";
import { useUserInfo } from "@fe/store/userStore";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { InferReqBodyType, InferResType } from "type-utils";
import { treatyClient, unwrap } from "./apiClient";
import { clinicScopedQueryKey } from "./clinic-context";

// export type RoleList = Treaty.Data<typeof treatyClient.api.role.get>;
export type RoleList = InferResType<typeof treatyClient.api.role.get>;

export const useRolesQuery = () => {
	const userInfo = useUserInfo();
	const userId = userInfo.id === undefined ? null : String(userInfo.id);
	const clinicState = useClinicStore();
	const clinicId = clinicState.userId === userId ? clinicState.activeClinicId : null;

	return useQuery<RoleList, unknown>({
		queryKey: clinicScopedQueryKey("roles", userId ?? "anonymous", clinicId ?? 0),
		enabled: Boolean(userId && clinicId !== null),
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
