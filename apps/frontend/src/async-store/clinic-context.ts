import useClinicStore from "@fe/store/clinicStore";
import { useUserInfo } from "@fe/store/userStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { ApiClientError, treatyClient, unwrap } from "./apiClient";

export type AvailableClinic = { id: number; name: string };
export type ClinicContextResponse = {
	activeClinic: AvailableClinic | null;
	availableClinics: AvailableClinic[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAvailableClinic(value: unknown): value is AvailableClinic {
	if (!isRecord(value)) return false;
	const clinic = value;
	return typeof clinic.id === "number" && Number.isSafeInteger(clinic.id) && typeof clinic.name === "string";
}

async function fetchClinicContext(): Promise<ClinicContextResponse> {
	const data: unknown = await unwrap(treatyClient.api["clinic-context"].get());
	if (!isRecord(data)) {
		throw new ApiClientError("The server returned an invalid clinic context response", 502);
	}

	const availableClinics = data.availableClinics;
	if (
		!Array.isArray(availableClinics) ||
		!availableClinics.every(isAvailableClinic) ||
		(data.activeClinic !== null && !isAvailableClinic(data.activeClinic))
	) {
		throw new ApiClientError("The server returned an invalid clinic context response", 502);
	}

	return {
		activeClinic: data.activeClinic,
		availableClinics,
	};
}

export const clinicContextQueryKey = (userId: string, clinicId: number | null) => ["clinic-context", userId, clinicId] as const;

export const clinicScopedQueryKey = (resource: string, userId: string, clinicId: number, ...keys: unknown[]) =>
	["clinic-scoped", resource, userId, clinicId, ...keys] as const;

export function useClinicContextQuery() {
	const userInfo = useUserInfo();
	const userId = userInfo.id === undefined ? null : String(userInfo.id);
	const clinicStore = useClinicStore();
	const activeClinicId = clinicStore.userId === userId ? clinicStore.activeClinicId : null;
	const queryClient = useQueryClient();
	const query = useQuery<ClinicContextResponse, unknown>({
		queryKey: clinicContextQueryKey(userId ?? "anonymous", activeClinicId),
		enabled: Boolean(userId),
		queryFn: fetchClinicContext,
		retry: false,
	});

	useEffect(() => {
		if (!userId || !query.data) return;
		if (query.data.activeClinic && activeClinicId === null) {
			clinicStore.setActiveClinic(query.data.activeClinic.id, userId);
			return;
		}
		if (activeClinicId !== null && query.data.activeClinic === null) {
			const stillAvailable = query.data.availableClinics.some(clinic => clinic.id === activeClinicId);
			if (!stillAvailable) clinicStore.clearActiveClinic();
		}
	}, [activeClinicId, clinicStore, query.data, userId]);

	useEffect(() => {
		if (query.error instanceof ApiClientError && query.error.status === 403 && activeClinicId !== null) {
			clinicStore.clearActiveClinic();
			queryClient.removeQueries({ queryKey: clinicContextQueryKey(userId ?? "anonymous", activeClinicId) });
		}
	}, [activeClinicId, clinicStore, query.error, queryClient, userId]);

	return query;
}

export function useSelectClinic() {
	const userInfo = useUserInfo();
	const userId = userInfo.id === undefined ? null : String(userInfo.id);
	const setActiveClinic = useClinicStore(state => state.setActiveClinic);
	const queryClient = useQueryClient();

	return (clinicId: number) => {
		if (!userId) return;
		queryClient.removeQueries({ queryKey: ["clinic-scoped"] });
		setActiveClinic(clinicId, userId);
	};
}
