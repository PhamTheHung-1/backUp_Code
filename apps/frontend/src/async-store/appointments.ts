import type {
	AppointmentCreate as AppointmentCreateBody,
	AppointmentUpdate as AppointmentUpdateBody,
} from "@be/modules/appointments/appointments.schema";
import { treatyClient, unwrap } from "@fe/async-store/apiClient";
import { clinicScopedQueryKey } from "@fe/async-store/clinic-context";
import useClinicStore from "@fe/store/clinicStore";
import { useUserInfo } from "@fe/store/userStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InferResType } from "type-utils";

export type AppointmentsPage = InferResType<typeof treatyClient.api.appointments.get>;
export type Appointment = AppointmentsPage["items"][number];
export type AppointmentStatus = "booked" | "confirmed" | "arrived" | "in_exam" | "completed" | "cancelled" | "no_show";
export type AppointmentCreate = AppointmentCreateBody;
export type AppointmentUpdate = AppointmentUpdateBody;
export type AppointmentListParams = {
	page: number;
	pageSize: number;
	from?: string;
	to?: string;
	status?: AppointmentStatus;
	veterinarianId?: number;
};
export type AppointmentSlots = {
	date: string;
	durationMinutes: number;
	timezone: string;
	slots: { veterinarianId: number; veterinarianName: string; startAt: string; endAt: string }[];
};
export type AppointmentSlot = AppointmentSlots["slots"][number];
export type ClinicHours = { timezone: string; days: { weekday: number; openTime: string; closeTime: string }[] };
export type ClinicHourInput = { days: { weekday: number; openTime: string; closeTime: string }[] };

function useClinicIdentity() {
	const userInfo = useUserInfo();
	const store = useClinicStore();
	const userId = userInfo.id === undefined ? null : String(userInfo.id);
	const clinicId = store.userId === userId ? store.activeClinicId : null;
	return { userId, clinicId };
}

function appointmentsKey(userId: string | null, clinicId: number | null) {
	return clinicScopedQueryKey("appointments", userId ?? "anonymous", clinicId ?? 0);
}

export function useAppointmentsQuery(params: AppointmentListParams) {
	const { userId, clinicId } = useClinicIdentity();
	return useQuery<AppointmentsPage, unknown>({
		queryKey: [...appointmentsKey(userId, clinicId), "list", params],
		enabled: Boolean(userId && clinicId !== null),
		queryFn: async () => unwrap(treatyClient.api.appointments.get({ query: params })),
	});
}

export function useAppointmentsRangeQuery(from: string, to: string) {
	const { userId, clinicId } = useClinicIdentity();
	return useQuery<AppointmentsPage["items"], unknown>({
		queryKey: [...appointmentsKey(userId, clinicId), "range", from, to],
		enabled: Boolean(userId && clinicId !== null && from && to),
		queryFn: async () => {
			const items: AppointmentsPage["items"] = [];
			let page = 1;
			let total = 0;
			do {
				const result = await unwrap(
					treatyClient.api.appointments.get({
						query: { page, pageSize: 100, from, to },
					}),
				);
				items.push(...result.items);
				total = result.total;
				page += 1;
			} while (items.length < total);
			return items;
		},
	});
}

export function useAppointmentDetailQuery(id: number | null) {
	const { userId, clinicId } = useClinicIdentity();
	return useQuery({
		queryKey: [...appointmentsKey(userId, clinicId), "detail", id],
		enabled: Boolean(userId && clinicId !== null && id !== null),
		queryFn: async () => {
			if (id === null) throw new Error("Appointment ID is required");
			return unwrap(treatyClient.api.appointments({ id }).get());
		},
	});
}

export function useAvailableSlotsQuery(input: { date: string; durationMinutes: number; veterinarianId?: number }, enabled = true) {
	const { userId, clinicId } = useClinicIdentity();
	return useQuery<AppointmentSlots, unknown>({
		queryKey: [...appointmentsKey(userId, clinicId), "slots", input],
		enabled: Boolean(enabled && userId && clinicId !== null && input.date),
		queryFn: async () => unwrap(treatyClient.api.appointments["available-slots"].get({ query: input })),
	});
}

export function useDailyQueueQuery(date: string) {
	const { userId, clinicId } = useClinicIdentity();
	return useQuery({
		queryKey: [...appointmentsKey(userId, clinicId), "daily-queue", date],
		enabled: Boolean(userId && clinicId !== null && date),
		queryFn: async () => unwrap(treatyClient.api.appointments["daily-queue"].get({ query: { date } })),
	});
}

export function useClinicHoursQuery() {
	const { userId, clinicId } = useClinicIdentity();
	return useQuery<ClinicHours, unknown>({
		queryKey: [...appointmentsKey(userId, clinicId), "clinic-hours"],
		enabled: Boolean(userId && clinicId !== null),
		queryFn: async () => unwrap(treatyClient.api.appointments["clinic-hours"].get()),
	});
}

function useInvalidateAppointments() {
	const queryClient = useQueryClient();
	const { userId, clinicId } = useClinicIdentity();
	return () => queryClient.invalidateQueries({ queryKey: appointmentsKey(userId, clinicId) });
}

export function useAppointmentCreateMutation() {
	const invalidate = useInvalidateAppointments();
	return useMutation({
		mutationFn: async (data: AppointmentCreate) => unwrap(treatyClient.api.appointments.post(data)),
		onSuccess: invalidate,
	});
}

export function useAppointmentUpdateMutation() {
	const invalidate = useInvalidateAppointments();
	return useMutation({
		mutationFn: async ({ id, data }: { id: number; data: AppointmentUpdate }) => unwrap(treatyClient.api.appointments({ id }).patch(data)),
		onSuccess: invalidate,
	});
}

export function useAppointmentActionMutation() {
	const invalidate = useInvalidateAppointments();
	return useMutation({
		mutationFn: async ({ id, action }: { id: number; action: "confirm" | "check-in" | "start-exam" | "complete" | "cancel" | "no-show" }) => {
			const endpoint = treatyClient.api.appointments({ id });
			switch (action) {
				case "confirm":
					return unwrap(endpoint.confirm.post());
				case "check-in":
					return unwrap(endpoint["check-in"].post());
				case "start-exam":
					return unwrap(endpoint["start-exam"].post());
				case "complete":
					return unwrap(endpoint.complete.post());
				case "cancel":
					return unwrap(endpoint.cancel.post());
				case "no-show":
					return unwrap(endpoint["no-show"].post());
			}
		},
		onSuccess: invalidate,
	});
}

export function useClinicHoursMutation() {
	const invalidate = useInvalidateAppointments();
	return useMutation({
		mutationFn: async (input: ClinicHourInput) => unwrap(treatyClient.api.appointments["clinic-hours"].put(input)),
		onSuccess: invalidate,
	});
}
