import type { PetUpdate as PetUpdateBody } from "@be/modules/pets/pets.schema";
import { treatyClient, unwrap } from "@fe/async-store/apiClient";
import { clinicScopedQueryKey } from "@fe/async-store/clinic-context";
import useClinicStore from "@fe/store/clinicStore";
import { useUserInfo } from "@fe/store/userStore";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { InferReqBodyType, InferResType } from "type-utils";

export type PetsPage = InferResType<typeof treatyClient.api.pets.get>;
export type Pet = PetsPage["items"][number];
export type PetCreate = InferReqBodyType<typeof treatyClient.api.pets.post>;
export type PetUpdate = PetUpdateBody;

export type PetListParams = {
	page: number;
	pageSize: number;
	search?: string;
	species?: string;
	sex?: "male" | "female" | "unknown";
	status?: boolean;
};

function useClinicIdentity() {
	const userInfo = useUserInfo();
	const store = useClinicStore();
	const userId = userInfo.id === undefined ? null : String(userInfo.id);
	const clinicId = store.userId === userId ? store.activeClinicId : null;
	return { userId, clinicId };
}

export function usePetsQuery(params: PetListParams) {
	const { userId, clinicId } = useClinicIdentity();
	return useQuery<PetsPage, unknown>({
		queryKey: clinicScopedQueryKey("pets", userId ?? "anonymous", clinicId ?? 0, params),
		enabled: Boolean(userId && clinicId !== null),
		queryFn: async () => unwrap(treatyClient.api.pets.get({ query: params })),
	});
}

export function usePetDetailQuery(id: number | null) {
	const { userId, clinicId } = useClinicIdentity();
	return useQuery({
		queryKey: clinicScopedQueryKey("pet", userId ?? "anonymous", clinicId ?? 0, id),
		enabled: Boolean(userId && clinicId !== null && id !== null),
		queryFn: async () => {
			if (id === null) throw new Error("Pet ID is required");
			return unwrap(treatyClient.api.pets({ id }).get());
		},
	});
}

export function usePetCreateMutation() {
	return useMutation({
		mutationFn: async (data: PetCreate) => unwrap(treatyClient.api.pets.post(data)),
	});
}

export function usePetUpdateMutation() {
	return useMutation({
		mutationFn: async ({ id, data }: { id: number; data: PetUpdate }) => unwrap(treatyClient.api.pets({ id }).patch(data)),
	});
}
