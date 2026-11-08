import { ApiClientError } from "@fe/async-store/apiClient";
import { useAppointmentDetailQuery, useAppointmentsRangeQuery } from "@fe/async-store/appointments";
import Card from "@fe/components/card";
import type { EventClickArg, EventInput } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { Alert, Descriptions, Drawer, Empty, Skeleton } from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import CalendarEvent from "./calendar-event";
import "./calendar.css";

const STATUS_COLORS: Record<string, string> = {
	booked: "#1677ff",
	confirmed: "#13a8a8",
	arrived: "#fa8c16",
	in_exam: "#722ed1",
	completed: "#52c41a",
	cancelled: "#8c8c8c",
	no_show: "#cf1322",
};

function errorMessage(error: unknown) {
	if (error instanceof ApiClientError && error.status === 403) return "You do not have permission to view this clinic calendar.";
	return error instanceof Error ? error.message : "Could not load clinic appointments.";
}

export default function Calendar() {
	const [range, setRange] = useState(() => {
		const now = new Date();
		const start = new Date(now.getFullYear(), now.getMonth(), 1);
		const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
		return { from: start.toISOString(), to: end.toISOString() };
	});
	const [detailId, setDetailId] = useState<number | null>(null);
	const appointmentsQuery = useAppointmentsRangeQuery(range.from, range.to);
	const detailQuery = useAppointmentDetailQuery(detailId);
	const events = useMemo<EventInput[]>(
		() =>
			(appointmentsQuery.data ?? []).map(appointment => ({
				id: String(appointment.id),
				title: `${appointment.petName} · ${appointment.ownerName}`,
				start: appointment.startAt,
				end: appointment.endAt,
				backgroundColor: STATUS_COLORS[appointment.status] ?? "#1677ff",
				borderColor: STATUS_COLORS[appointment.status] ?? "#1677ff",
				extendedProps: { status: appointment.status },
			})),
		[appointmentsQuery.data],
	);

	const handleEventClick = (event: EventClickArg) => {
		const id = Number(event.event.id);
		if (Number.isSafeInteger(id) && id > 0) setDetailId(id);
	};

	return (
		<Card className="h-full w-full">
			<div className="slash-calendar">
				{appointmentsQuery.isError ? <Alert className="mb-3" type="error" showIcon message={errorMessage(appointmentsQuery.error)} /> : null}
				{appointmentsQuery.isLoading ? <Skeleton active /> : null}
				<FullCalendar
					plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
					initialView="dayGridMonth"
					events={events}
					eventContent={CalendarEvent}
					headerToolbar={{
						left: "prev,next today",
						center: "title",
						right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
					}}
					datesSet={info =>
						setRange(previous => {
							const next = { from: info.start.toISOString(), to: info.end.toISOString() };
							return previous.from === next.from && previous.to === next.to ? previous : next;
						})
					}
					eventClick={handleEventClick}
					height="auto"
					noEventsContent={<Empty description="No appointments in this period" />}
				/>
			</div>
			<Drawer title="Appointment detail" open={detailId !== null} onClose={() => setDetailId(null)} width={520}>
				{detailQuery.isLoading ? <Skeleton active /> : null}
				{detailQuery.isError ? <Alert type="error" showIcon message={errorMessage(detailQuery.error)} /> : null}
				{detailQuery.data ? (
					<Descriptions bordered column={1}>
						<Descriptions.Item label="Pet">
							{detailQuery.data.petName} ({detailQuery.data.petCode})
						</Descriptions.Item>
						<Descriptions.Item label="Owner">
							{detailQuery.data.ownerName} · {detailQuery.data.ownerPhone ?? "No phone"}
						</Descriptions.Item>
						<Descriptions.Item label="Veterinarian">{detailQuery.data.veterinarianName ?? "Unassigned"}</Descriptions.Item>
						<Descriptions.Item label="Start">{dayjs(detailQuery.data.startAt).format("YYYY-MM-DD HH:mm")}</Descriptions.Item>
						<Descriptions.Item label="End">{dayjs(detailQuery.data.endAt).format("YYYY-MM-DD HH:mm")}</Descriptions.Item>
						<Descriptions.Item label="Status">{detailQuery.data.status}</Descriptions.Item>
						<Descriptions.Item label="Reason">{detailQuery.data.reason ?? "—"}</Descriptions.Item>
					</Descriptions>
				) : null}
			</Drawer>
		</Card>
	);
}
