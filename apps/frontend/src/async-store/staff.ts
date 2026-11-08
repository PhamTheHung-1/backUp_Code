import type { StaffUpdate as StaffUpdateBody } from "@be/modules/staff/staff.schema";
import { treatyClient, unwrap } from "@fe/async-store/apiClient";
import { clinicScopedQueryKey } from "@fe/async-store/clinic-context";
import useClinicStore from "@fe/store/clinicStore";
import { useUserInfo } from "@fe/store/userStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InferReqBodyType, InferResType } from "type-utils";

export type StaffPage = InferResType<typeof treatyClient.api.staff.get>;
export type Staff = StaffPage["items"][number];
export type StaffCreate = InferReqBodyType<typeof treatyClient.api.staff.post>;
export type StaffUpdate = StaffUpdateBody;
export type JobTitle = NonNullable<Staff["jobTitle"]>;
export type JobTitlePage = JobTitle[];

export type StaffListParams = {
	page: number;
	pageSize: number;
	search?: string;
	jobTitleId?: number;
	employmentStatus?: "active" | "on_leave" | "terminated";
	membershipStatus?: "invited" | "active" | "suspended" | "removed";
};

function useClinicIdentity() {
	const userInfo = useUserInfo();
	const store = useClinicStore();
	const userId = userInfo.id === undefined ? null : String(userInfo.id);
	const clinicId = store.userId === userId ? store.activeClinicId : null;
	return { userId, clinicId };
}

export function staffQueryKey(userId: string | null, clinicId: number | null, suffix?: unknown[]) {
	return clinicScopedQueryKey("staff", userId ?? "anonymous", clinicId ?? 0, ...(suffix ?? []));
}

export function useStaffQuery(params: StaffListParams) {
	const { userId, clinicId } = useClinicIdentity();
	return useQuery<StaffPage, unknown>({
		queryKey: staffQueryKey(userId, clinicId, ["list", params]),
		enabled: Boolean(userId && clinicId !== null),
		queryFn: async () => unwrap(treatyClient.api.staff.get({ query: params })),
	});
}

export function useStaffDetailQuery(membershipId: number | null) {
	const { userId, clinicId } = useClinicIdentity();
	return useQuery({
		queryKey: staffQueryKey(userId, clinicId, ["detail", membershipId]),
		enabled: Boolean(userId && clinicId !== null && membershipId !== null),
		queryFn: async () => {
			if (membershipId === null) throw new Error("Staff membership ID is required");
			return unwrap(treatyClient.api.staff({ membershipId }).get());
		},
	});
}

export function useStaffJobTitlesQuery(status?: boolean) {
	const { userId, clinicId } = useClinicIdentity();
	return useQuery<JobTitlePage, unknown>({
		queryKey: staffQueryKey(userId, clinicId, ["job-titles", status]),
		enabled: Boolean(userId && clinicId !== null),
		queryFn: async () =>
			unwrap(treatyClient.api.staff["job-titles"].get({ query: status === undefined ? {} : { status } })),
	});
}

export function useStaffInvalidate() {
	const queryClient = useQueryClient();
	const { userId, clinicId } = useClinicIdentity();
	return () => queryClient.invalidateQueries({ queryKey: staffQueryKey(userId, clinicId) });
}

export function useStaffCreateMutation() {
	const invalidate = useStaffInvalidate();
	return useMutation({
		mutationFn: async (data: StaffCreate) => unwrap(treatyClient.api.staff.post(data)),
		onSuccess: invalidate,
	});
}

export function useStaffUpdateMutation() {
	const invalidate = useStaffInvalidate();
	return useMutation({
		mutationFn: async ({ membershipId, data }: { membershipId: number; data: StaffUpdate }) =>
			unwrap(treatyClient.api.staff({ membershipId }).patch(data)),
		onSuccess: invalidate,
	});
}

export function useStaffProfileStatusMutation() {
	const invalidate = useStaffInvalidate();
	return useMutation({
		mutationFn: async ({
			membershipId,
			data,
		}: {
			membershipId: number;
			data: { employmentStatus: "active" | "on_leave" | "terminated"; endedAt?: string | null; note?: string | null };
		}) => unwrap(treatyClient.api.staff({ membershipId })["profile-status"].patch(data)),
		onSuccess: invalidate,
	});
}

export function useStaffMembershipStatusMutation() {
	const invalidate = useStaffInvalidate();
	return useMutation({
		mutationFn: async ({
			membershipId,
			status,
		}: {
			membershipId: number;
			status: "invited" | "active" | "suspended" | "removed";
		}) => unwrap(treatyClient.api.staff({ membershipId })["membership-status"].patch({ status })),
		onSuccess: invalidate,
	});
}

export function useStaffRolesMutation() {
	const invalidate = useStaffInvalidate();
	return useMutation({
		mutationFn: async ({ membershipId, roleIds }: { membershipId: number; roleIds: number[] }) =>
			unwrap(treatyClient.api.staff({ membershipId }).roles.put({ roleIds })),
		onSuccess: invalidate,
	});
}
