import { ApiClientError } from "@fe/async-store/apiClient";
import {
	type Appointment,
	type AppointmentCreate,
	type AppointmentSlot,
	type AppointmentStatus,
	useAppointmentActionMutation,
	useAppointmentCreateMutation,
	useAppointmentDetailQuery,
	useAppointmentsQuery,
	useAppointmentsRangeQuery,
	useAppointmentUpdateMutation,
	useAvailableSlotsQuery,
	useClinicHoursQuery,
} from "@fe/async-store/appointments";
import { usePetsQuery } from "@fe/async-store/pets";
import CalendarEvent from "@fe/pages/sys/others/calendar/calendar-event";
import type { EventClickArg, EventInput } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import "@fe/pages/sys/others/calendar/calendar.css";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import {
	Alert,
	Button,
	DatePicker,
	Descriptions,
	Drawer,
	Empty,
	Form,
	Input,
	Modal,
	Popconfirm,
	Segmented,
	Select,
	Space,
	Spin,
	Table,
	Tag,
	Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { type Dayjs } from "dayjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const APPOINTMENT_STATUSES: AppointmentStatus[] = ["booked", "confirmed", "arrived", "in_exam", "completed", "cancelled", "no_show"];
const DURATIONS = [15, 30, 45, 60];
const STATUS_COLORS: Record<string, string> = {
	booked: "#D4A72C",
	confirmed: "#52C41A",
	arrived: "#FA8C16",
	in_exam: "#722ED1",
	completed: "#D97845",
	cancelled: "#D66A6A",
	no_show: "#CF1322",
};

function getErrorMessage(error: unknown, permissionMessage = "Bạn không có quyền xem lịch hẹn.") {
	if (error instanceof ApiClientError && error.status === 403) return permissionMessage;
	if (error instanceof ApiClientError && error.status === 409) return "That time conflicts with another appointment. Choose another available slot.";
	return error instanceof Error ? error.message : "Could not load appointments.";
}

function formatClinicTime(value: string, timezone: string) {
	return new Intl.DateTimeFormat(undefined, { timeZone: timezone, hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatClinicDate(value: Date, timezone: string) {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: timezone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(value);
	const result = Object.fromEntries(parts.map(part => [part.type, part.value]));
	return `${result.year}-${result.month}-${result.day}`;
}

function appointmentSlotValue(slot: Pick<AppointmentSlot, "veterinarianId" | "startAt">) {
	return `${slot.veterinarianId}|${slot.startAt}`;
}

function clinicDateTimeIso(value: Date, timezone: string) {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: timezone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hourCycle: "h23",
	}).formatToParts(value);
	const result = Object.fromEntries(parts.map(part => [part.type, part.value]));
	const wallTime = `${result.year}-${result.month}-${result.day}T${result.hour}:${result.minute}:${result.second}`;
	const wallUtc = Date.UTC(
		Number(result.year),
		Number(result.month) - 1,
		Number(result.day),
		Number(result.hour),
		Number(result.minute),
		Number(result.second),
	);
	const offsetMinutes = Math.round((wallUtc - Math.floor(value.getTime() / 1000) * 1000) / 60000);
	const sign = offsetMinutes >= 0 ? "+" : "-";
	const absolute = Math.abs(offsetMinutes);
	const hours = String(Math.floor(absolute / 60)).padStart(2, "0");
	const minutes = String(absolute % 60).padStart(2, "0");
	return `${wallTime}${sign}${hours}:${minutes}`;
}

function formatCalendarTitle(start: Date, end: Date, view: string, timezone: string) {
	const lastDay = new Date(end.getTime() - 1);
	if (view === "dayGridMonth") {
		    const title = new Intl.DateTimeFormat("vi-VN", {
        timeZone: timezone,
        month: "long",
        year: "numeric",
    }).format(start);

    return title.charAt(0).toLocaleUpperCase("vi-VN") === undefined
        ? title
        : title.charAt(0).toLocaleUpperCase("vi-VN") + title.slice(1);
	}
	const from = new Intl.DateTimeFormat("vi-VN", { timeZone: timezone, day: "numeric", month: "short" }).format(start);
	const to = new Intl.DateTimeFormat("vi-VN", { timeZone: timezone, day: "numeric", month: "short", year: "numeric" }).format(lastDay);
	return `${from} – ${to}`;
}

type EditorValues = {
	petId: number;
	date: Dayjs;
	durationMinutes: number;
	slot: string;
	reason?: string;
};

function AppointmentEditor({
	appointment,
	onCancel,
	onSubmit,
}: {
	appointment: Appointment | null;
	onCancel: () => void;
	onSubmit: (values: EditorValues, slot: AppointmentSlot | null) => Promise<void>;
}) {
	const [form] = Form.useForm<EditorValues>();
	const clinicHoursQuery = useClinicHoursQuery();
	const timezone = clinicHoursQuery.data?.timezone ?? "UTC";
	const getAppointmentDate = useCallback(
		() => (appointment ? formatClinicDate(new Date(appointment.startAt), timezone) : formatClinicDate(new Date(), timezone)),
		[appointment, timezone],
	);
	const [date, setDate] = useState<Dayjs>(() => dayjs(getAppointmentDate()));
	const [petSearch, setPetSearch] = useState("");
	const [duration, setDuration] = useState(appointment ? Math.max(5, dayjs(appointment.endAt).diff(dayjs(appointment.startAt), "minute")) : 30);
	const slotsQuery = useAvailableSlotsQuery({ date: date.format("YYYY-MM-DD"), durationMinutes: duration });
	const petsQuery = usePetsQuery({ page: 1, pageSize: 100, status: true, search: petSearch.trim() || undefined });
	const originalDuration = appointment ? dayjs(appointment.endAt).diff(dayjs(appointment.startAt), "minute") : null;
	const originalDate = appointment ? formatClinicDate(new Date(appointment.startAt), timezone) : null;
	const currentSlotAvailable = Boolean(appointment && originalDate === date.format("YYYY-MM-DD") && originalDuration === duration);
	const durationOptions = [...new Set([...DURATIONS, ...(originalDuration && !DURATIONS.includes(originalDuration) ? [originalDuration] : [])])].sort(
		(a, b) => a - b,
	);
	const currentSlot = useMemo<AppointmentSlot | null>(
		() =>
			appointment?.veterinarianId && currentSlotAvailable
				? {
						veterinarianId: appointment.veterinarianId,
						veterinarianName: appointment.veterinarianName ?? "Veterinarian",
						startAt: appointment.startAt,
						endAt: appointment.endAt,
					}
				: null,
		[appointment, currentSlotAvailable],
	);
	const slots = useMemo(() => {
		const available = slotsQuery.data?.slots ?? [];
		if (currentSlot && !available.some(slot => appointmentSlotValue(slot) === appointmentSlotValue(currentSlot))) {
			return [currentSlot, ...available];
		}
		return available;
	}, [currentSlot, slotsQuery.data?.slots]);

	useEffect(() => {
		const clinicDate = dayjs(getAppointmentDate());
		setDate(clinicDate);
		form.setFieldsValue({
			petId: appointment?.petId,
			date: clinicDate,
			durationMinutes: appointment ? dayjs(appointment.endAt).diff(dayjs(appointment.startAt), "minute") : 30,
			slot: currentSlot ? appointmentSlotValue(currentSlot) : undefined,
			reason: appointment?.reason ?? "",
		});
	}, [appointment, currentSlot, form, getAppointmentDate]);

	const handleDateChange = (value: Dayjs | null) => {
		if (!value) return;
		setDate(value);
		form.setFieldValue("slot", undefined);
	};

	const handleDurationChange = (value: number) => {
		setDuration(value);
		form.setFieldValue("slot", undefined);
	};

	return (
		<Modal title={appointment ? "Edit appointment" : "Create appointment"} open onCancel={onCancel} onOk={() => form.submit()} destroyOnClose>
			<Form<EditorValues>
				form={form}
				layout="vertical"
				initialValues={{
					petId: appointment?.petId,
					date: appointment ? dayjs(appointment.startAt) : dayjs(),
					durationMinutes: appointment ? dayjs(appointment.endAt).diff(dayjs(appointment.startAt), "minute") : 30,
					slot: currentSlot ? appointmentSlotValue(currentSlot) : undefined,
					reason: appointment?.reason ?? "",
				}}
				onFinish={values => onSubmit(values, slots.find(slot => appointmentSlotValue(slot) === values.slot) ?? null)}
			>
				<Form.Item name="petId" label="Pet" rules={[{ required: true, message: "Choose a pet" }]}>
					<Select<number>
						showSearch
						filterOption={false}
						loading={petsQuery.isFetching}
						onSearch={setPetSearch}
						placeholder="Choose an active pet"
						options={(petsQuery.data?.items ?? []).map(pet => ({
							value: pet.id,
							label: `${pet.name} (${pet.petCode}) · ${pet.ownerName}`,
						}))}
					/>
				</Form.Item>
				<Form.Item name="date" label="Clinic date" rules={[{ required: true }]}>
					<DatePicker className="w-full" value={date} onChange={handleDateChange} disabledDate={value => value.isBefore(dayjs(), "day")} />
				</Form.Item>
				<Form.Item name="durationMinutes" label="Duration" rules={[{ required: true }]}>
					<Select
						value={duration}
						onChange={handleDurationChange}
						options={durationOptions.map(minutes => ({ label: `${minutes} minutes`, value: minutes }))}
					/>
				</Form.Item>
				<Form.Item
					name="slot"
					label="Available time"
					rules={[{ required: !appointment || !currentSlotAvailable, message: "Choose an available time" }]}
				>
					<Select
						loading={slotsQuery.isFetching}
						placeholder="Choose a veterinarian and time"
						options={slots.map(slot => ({
							value: appointmentSlotValue(slot),
							label: `${formatClinicTime(slot.startAt, slotsQuery.data?.timezone ?? "UTC")} · ${slot.veterinarianName}`,
						}))}
					/>
				</Form.Item>
				{slotsQuery.isError ? <Alert type="error" showIcon message={getErrorMessage(slotsQuery.error)} /> : null}
				{!slotsQuery.isFetching && !slotsQuery.isError && slots.length === 0 ? (
					<Alert className="mb-4" type="info" message="No available appointments for this date and duration." />
				) : null}
				{petsQuery.isError ? <Alert className="mb-4" type="error" showIcon message={getErrorMessage(petsQuery.error)} /> : null}
				<Form.Item name="reason" label="Reason">
					<Input.TextArea maxLength={500} rows={3} />
				</Form.Item>
			</Form>
		</Modal>
	);
}

export default function AppointmentsPage() {
	const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
	const [calendarView, setCalendarView] = useState<"dayGridMonth" | "timeGridWeek" | "timeGridDay">("dayGridMonth");
	const [calendarTitle, setCalendarTitle] = useState("");
	const [calendarRange, setCalendarRange] = useState<{ from: string; to: string }>({ from: "", to: "" });
	const calendarRef = useRef<FullCalendar>(null);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(20);
	const [status, setStatus] = useState<AppointmentStatus | undefined>();
	const [search, setSearch] = useState("");
	const [listDate, setListDate] = useState<Dayjs | null>(null);
	const [veterinarianId, setVeterinarianId] = useState<number | undefined>();
	const [editorOpen, setEditorOpen] = useState(false);
	const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
	const [detailId, setDetailId] = useState<number | null>(null);
	const hoursQuery = useClinicHoursQuery();
	const hoursQueryTimezone = hoursQuery.data?.timezone ?? "UTC";
	const listFrom = listDate ? clinicDateTimeIso(listDate.startOf("day").toDate(), hoursQueryTimezone) : undefined;
	const listTo = listDate ? clinicDateTimeIso(listDate.add(1, "day").startOf("day").toDate(), hoursQueryTimezone) : undefined;
	const appointmentsQuery = useAppointmentsQuery({ page, pageSize, status, veterinarianId, from: listFrom, to: listTo });
	const calendarAppointmentsQuery = useAppointmentsRangeQuery(calendarRange.from, calendarRange.to);
	const calendarEvents = useMemo<EventInput[]>(
		() =>
			(calendarAppointmentsQuery.data ?? []).map(appointment => ({
				id: String(appointment.id),
				title: `${appointment.petName} · ${appointment.ownerName}`,
				start: appointment.startAt,
				end: appointment.endAt,
				backgroundColor: STATUS_COLORS[appointment.status] ?? "#1677ff",
				borderColor: STATUS_COLORS[appointment.status] ?? "#1677ff",
				extendedProps: { status: appointment.status },
			})),
		[calendarAppointmentsQuery.data],
	);
	const detailQuery = useAppointmentDetailQuery(detailId);
	const createAppointment = useAppointmentCreateMutation();
	const updateAppointment = useAppointmentUpdateMutation();
	const appointmentAction = useAppointmentActionMutation();
	const submitEditor = async (values: EditorValues, selectedSlot: AppointmentSlot | null) => {
		try {
			if (editingAppointment) {
				const data = {
					petId: values.petId,
					reason: values.reason?.trim() || null,
					...(selectedSlot &&
					(selectedSlot.startAt !== editingAppointment.startAt || selectedSlot.veterinarianId !== editingAppointment.veterinarianId)
						? { startAt: selectedSlot.startAt, endAt: selectedSlot.endAt, veterinarianId: selectedSlot.veterinarianId }
						: {}),
				};
				await updateAppointment.mutateAsync({ id: editingAppointment.id, data });
				toast.success("Appointment updated");
			} else {
				if (!selectedSlot) throw new Error("Choose an available appointment time");
				const payload: AppointmentCreate = {
					petId: values.petId,
					veterinarianId: selectedSlot.veterinarianId,
					startAt: selectedSlot.startAt,
					endAt: selectedSlot.endAt,
					reason: values.reason?.trim() || undefined,
				};
				await createAppointment.mutateAsync(payload);
				toast.success("Appointment created");
			}
			setEditorOpen(false);
			setEditingAppointment(null);
		} catch (error) {
			toast.error(getErrorMessage(error, editingAppointment ? "Bạn không có quyền chỉnh sửa lịch hẹn." : "Bạn không có quyền tạo lịch hẹn."));
		}
	};

	const runAction = async (appointment: Appointment, action: Parameters<typeof appointmentAction.mutateAsync>[0]["action"]) => {
		try {
			await appointmentAction.mutateAsync({ id: appointment.id, action });
			toast.success("Appointment status updated");
			if (detailId === appointment.id) await detailQuery.refetch();
		} catch (error) {
			toast.error(getErrorMessage(error, "Bạn không có quyền thực hiện thao tác này."));
		}
	};

	const handleCalendarEventClick = (event: EventClickArg) => {
		const id = Number(event.event.id);
		if (Number.isSafeInteger(id) && id > 0) setDetailId(id);
	};

	const actionButtons = (appointment: Appointment) => {
		const buttons: { label: string; action: Parameters<typeof appointmentAction.mutateAsync>[0]["action"]; danger?: boolean }[] = [];
		if (appointment.status === "booked") buttons.push({ label: "Confirm", action: "confirm" }, { label: "Cancel", action: "cancel", danger: true });
		if (appointment.status === "confirmed")
			buttons.push(
				{ label: "Check in", action: "check-in" },
				{ label: "No-show", action: "no-show", danger: true },
				{ label: "Cancel", action: "cancel", danger: true },
			);
		if (appointment.status === "arrived")
			buttons.push({ label: "Start exam", action: "start-exam" }, { label: "Cancel", action: "cancel", danger: true });
		if (appointment.status === "in_exam") buttons.push({ label: "Complete", action: "complete" });
		return (
			<Space wrap>
				{appointment.status === "booked" || appointment.status === "confirmed" ? (
					<Button
						size="small"
						onClick={() => {
							setEditingAppointment(appointment);
							setEditorOpen(true);
						}}
					>
						Edit
					</Button>
				) : null}
				{buttons.map(button => (
					<Popconfirm
						key={button.action}
						title={`${button.label} this appointment?`}
						onConfirm={() => runAction(appointment, button.action)}
						okButtonProps={{ danger: button.danger }}
					>
						<Button size="small" danger={button.danger}>
							{button.label}
						</Button>
					</Popconfirm>
				))}
			</Space>
		);
	};

	const columns: ColumnsType<Appointment> = [
		{ title: "Thời gian", dataIndex: "startAt", key: "startAt", render: (value: string) => dayjs(value).format("DD/MM/YYYY HH:mm") },
		{
			title: "THÚ CƯNG / CHỦ NUÔI",
			key: "pet",
			render: (_, appointment) => (
				<Button type="link" className="!block !h-auto !p-0 !text-left" onClick={() => setDetailId(appointment.id)}>
					<Typography.Text strong>{appointment.petName}</Typography.Text>
					<br />
					<Typography.Text>{appointment.ownerName}</Typography.Text>
					{appointment.ownerPhone ? (
						<>
							<br />
							<Typography.Text type="secondary">{appointment.ownerPhone}</Typography.Text>
						</>
					) : null}
				</Button>
			),
		},
		{ title: "Bác sĩ", dataIndex: "veterinarianName", key: "veterinarianName", render: value => value ?? "Chưa phân công" },
		{
			title: "Trạng thái",
			dataIndex: "status",
			key: "status",
			render: value => (
				<Tag
					color={value === "cancelled" || value === "no_show" ? "red" : value === "completed" ? "orange" : value === "confirmed" ? "green" : "gold"}
				>
					{String(value).replace("_", " ")}
				</Tag>
			),
		},
		{ title: "Thao tác", key: "actions", render: (_, appointment) => actionButtons(appointment) },
	];

	const allItems = appointmentsQuery.data?.items ?? [];
	const normalizedSearch = search.trim().toLowerCase();
	const displayedItems = normalizedSearch
		? allItems.filter(appointment =>
				[appointment.petName, appointment.petCode, appointment.ownerName, appointment.ownerPhone].some(value =>
					value?.toLowerCase().includes(normalizedSearch),
				),
			)
		: allItems;
	const veterinarianOptions = useMemo(() => {
		const doctors = new Map<number, string>();
		for (const appointment of allItems) {
			if (appointment.veterinarianId && appointment.veterinarianName) doctors.set(appointment.veterinarianId, appointment.veterinarianName);
		}
		return [{ value: undefined, label: "Tất cả bác sĩ" }, ...Array.from(doctors, ([value, label]) => ({ value, label }))];
	}, [allItems]);
	const selectedAppointment = detailQuery.data;
	const hoursMissing = hoursQuery.data?.days.length === 0;
	const vietnameseWeekday = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"][dayjs().day()];

	return (
		<div className="p-4">
			<div className="mb-3">
				<Typography.Title level={3} className="!mb-1">
					Lịch hẹn
				</Typography.Title>
				<Typography.Text type="secondary">
					{vietnameseWeekday}, {dayjs().format("DD/MM/YYYY")}
				</Typography.Text>
			</div>
			<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
				<Segmented<"calendar" | "list">
					options={[
						{ label: "Lịch", value: "calendar" },
						{ label: "Danh sách", value: "list" },
					]}
					value={viewMode}
					onChange={setViewMode}
				/>
				<Button
					type="primary"
					onClick={() => {
						setEditingAppointment(null);
						setEditorOpen(true);
					}}
				>
					+ Tạo lịch hẹn
				</Button>
			</div>
			{hoursMissing ? (
				<Alert
					className="mb-4"
					type="warning"
					showIcon
					message="Giờ làm việc của phòng khám chưa được cấu hình. Các khung giờ trống có thể không khả dụng."
				/>
			) : null}
			{viewMode === "list" && appointmentsQuery.isError ? (
				<Alert className="mb-4" type="error" showIcon message={getErrorMessage(appointmentsQuery.error)} />
			) : null}
			{viewMode === "calendar" ? (
				<div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#E8E2D8] bg-white px-3 py-2">
					<Space>
						<Button aria-label="Previous calendar period" icon={<LeftOutlined />} onClick={() => calendarRef.current?.getApi().prev()} />
						<Button onClick={() => calendarRef.current?.getApi().today()}>Hôm nay</Button>
						<Button aria-label="Next calendar period" icon={<RightOutlined />} onClick={() => calendarRef.current?.getApi().next()} />
					</Space>
					<Typography.Text strong>{calendarTitle}</Typography.Text>
					<Segmented<"dayGridMonth" | "timeGridWeek" | "timeGridDay">
						options={[
							{ label: "Tháng", value: "dayGridMonth" },
							{ label: "Tuần", value: "timeGridWeek" },
							{ label: "Ngày", value: "timeGridDay" },
						]}
						value={calendarView}
						onChange={value => {
							setCalendarView(value);
							calendarRef.current?.getApi().changeView(value);
						}}
					/>
				</div>
			) : (
				<div className="mb-3 flex flex-wrap items-center gap-3">
					<Input.Search
						allowClear
						placeholder="Tìm theo tên bé / chủ nuôi..."
						value={search}
						onChange={event => setSearch(event.target.value)}
						className="min-w-[220px] max-w-[320px]"
					/>
					<DatePicker
						allowClear
						placeholder="Ngày"
						value={listDate}
						onChange={value => {
							setListDate(value);
							setPage(1);
						}}
					/>
					<Select<number | undefined>
						aria-label="Veterinarian"
						className="min-w-[160px]"
						value={veterinarianId}
						onChange={value => {
							setVeterinarianId(value);
							setPage(1);
						}}
						options={veterinarianOptions}
					/>
					<Select<AppointmentStatus>
						aria-label="Appointment status"
						allowClear
						placeholder="Tất cả trạng thái"
						value={status}
						onChange={value => {
							setStatus(value);
							setPage(1);
						}}
						options={APPOINTMENT_STATUSES.map(value => ({
							value,
							label:
								value === "booked"
									? "Chờ xác nhận"
									: value === "confirmed"
										? "Đã xác nhận"
											: value === "arrived"
												? "Đã đến"
													: value === "in_exam"
														? "Đang khám"
														: value === "completed"
															? "Hoàn thành"
															: value === "cancelled"
																? "Đã hủy"
																:"Không đến",
						}))}
					/>
					{normalizedSearch || status || veterinarianId || listDate ? (
						<Button
							onClick={() => {
								setSearch("");
								setStatus(undefined);
								setVeterinarianId(undefined);
								setListDate(null);
								setPage(1);
							}}
						>
							Xóa bộ lọc
						</Button>
					) : null}
				</div>
			)}
			{viewMode === "calendar" ? (
				<div className="slash-calendar relative">
					{calendarAppointmentsQuery.isError ? (
						<Alert className="mb-3" type="error" showIcon message={getErrorMessage(calendarAppointmentsQuery.error)} />
					) : null}
					{calendarAppointmentsQuery.isFetching ? (
						<div className="absolute right-3 top-3 z-[10] rounded-md bg-white px-3 py-2 shadow-sm">
							<Spin size="small" />
						</div>
					) : null}
					<FullCalendar
						ref={calendarRef}
						plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
						initialView="dayGridMonth"
						timeZone={hoursQueryTimezone}
						events={calendarEvents}
						eventContent={CalendarEvent}
						headerToolbar={false}
						datesSet={info => {
							setCalendarTitle(formatCalendarTitle(info.start, info.end, info.view.type, hoursQueryTimezone));
							setCalendarRange(previous => {
								const next = { from: clinicDateTimeIso(info.start, hoursQueryTimezone), to: clinicDateTimeIso(info.end, hoursQueryTimezone) };
								return previous.from === next.from && previous.to === next.to ? previous : next;
							});
						}}
						eventClick={handleCalendarEventClick}
						height="auto"
						noEventsContent={<Empty description="Không có lịch hẹn trong khoảng thời gian này" />}
					/>
				</div>
			) : (
				<Table
					rowKey="id"
					columns={columns}
					dataSource={displayedItems}
					loading={appointmentsQuery.isFetching}
					locale={{
						emptyText: (
							<Empty
								description={normalizedSearch || status || veterinarianId || listDate ? "Không tìm thấy lịch hẹn phù hợp." : "Không có lịch hẹn."}
							/>
						),
					}}
					pagination={{
						current: page,
						pageSize,
						total: appointmentsQuery.data?.total ?? 0,
						showSizeChanger: true,
						onChange: (nextPage, nextPageSize) => {
							setPage(nextPage);
							setPageSize(nextPageSize);
						},
					}}
				/>
			)}
			{editorOpen ? (
				<AppointmentEditor
					appointment={editingAppointment}
					onCancel={() => {
						setEditorOpen(false);
						setEditingAppointment(null);
					}}
					onSubmit={submitEditor}
				/>
			) : null}
			<Drawer title="Appointment detail" open={detailId !== null} onClose={() => setDetailId(null)} width={520}>
				{detailQuery.isLoading ? <Typography.Text>Loading appointment…</Typography.Text> : null}
				{detailQuery.isError ? <Alert type="error" showIcon message={getErrorMessage(detailQuery.error)} /> : null}
				{selectedAppointment ? (
					<Descriptions column={1} bordered>
						<Descriptions.Item label="Pet">
							{selectedAppointment.petName} ({selectedAppointment.petCode})
						</Descriptions.Item>
						<Descriptions.Item label="Owner">
							{selectedAppointment.ownerName} · {selectedAppointment.ownerPhone ?? "No phone"}
						</Descriptions.Item>
						<Descriptions.Item label="Veterinarian">{selectedAppointment.veterinarianName ?? "Unassigned"}</Descriptions.Item>
						<Descriptions.Item label="Start">{dayjs(selectedAppointment.startAt).format("YYYY-MM-DD HH:mm")}</Descriptions.Item>
						<Descriptions.Item label="End">{dayjs(selectedAppointment.endAt).format("YYYY-MM-DD HH:mm")}</Descriptions.Item>
						<Descriptions.Item label="Status">{selectedAppointment.status}</Descriptions.Item>
						<Descriptions.Item label="Reason">{selectedAppointment.reason ?? "—"}</Descriptions.Item>
					</Descriptions>
				) : null}
			</Drawer>
		</div>
	);
}
