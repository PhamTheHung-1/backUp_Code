import type { OwnerUpdate as OwnerUpdateBody } from "@be/modules/owners/owners.schema";
import { treatyClient, unwrap } from "@fe/async-store/apiClient";
import { clinicScopedQueryKey } from "@fe/async-store/clinic-context";
import useClinicStore from "@fe/store/clinicStore";
import { useUserInfo } from "@fe/store/userStore";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { InferReqBodyType, InferResType } from "type-utils";

export type OwnersPage = InferResType<typeof treatyClient.api.owners.get>;
export type Owner = OwnersPage["items"][number];
export type OwnerCreate = InferReqBodyType<typeof treatyClient.api.owners.post>;
export type OwnerUpdate = OwnerUpdateBody;

export type OwnerListParams = {
	page: number;
	pageSize: number;
	search?: string;
	status?: boolean;
};

function useClinicIdentity() {
	const userInfo = useUserInfo();
	const store = useClinicStore();
	const userId = userInfo.id === undefined ? null : String(userInfo.id);
	const clinicId = store.userId === userId ? store.activeClinicId : null;
	return { userId, clinicId };
}

export function useOwnersQuery(params: OwnerListParams) {
	const { userId, clinicId } = useClinicIdentity();
	return useQuery<OwnersPage, unknown>({
		queryKey: clinicScopedQueryKey("owners", userId ?? "anonymous", clinicId ?? 0, params),
		enabled: Boolean(userId && clinicId !== null),
		queryFn: async () => unwrap(treatyClient.api.owners.get({ query: params })),
	});
}

export function useOwnerDetailQuery(id: number | null) {
	const { userId, clinicId } = useClinicIdentity();
	return useQuery({
		queryKey: clinicScopedQueryKey("owner", userId ?? "anonymous", clinicId ?? 0, id),
		enabled: Boolean(userId && clinicId !== null && id !== null),
		queryFn: async () => {
			if (id === null) throw new Error("Owner ID is required");
			return unwrap(treatyClient.api.owners({ id }).get());
		},
	});
}

export function useOwnerCreateMutation() {
	return useMutation({
		mutationFn: async (data: OwnerCreate) => unwrap(treatyClient.api.owners.post(data)),
	});
}

export function useOwnerUpdateMutation() {
	return useMutation({
		mutationFn: async ({ id, data }: { id: number; data: OwnerUpdate }) => unwrap(treatyClient.api.owners({ id }).patch(data)),
	});
}
