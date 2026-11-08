import { ApiClientError } from "@fe/async-store/apiClient";
import { useRolesQuery } from "@fe/async-store/role";
import {
	type Staff,
	type StaffCreate,
	type StaffUpdate,
	useStaffCreateMutation,
	useStaffDetailQuery,
	useStaffJobTitlesQuery,
	useStaffMembershipStatusMutation,
	useStaffProfileStatusMutation,
	useStaffQuery,
	useStaffRolesMutation,
	useStaffUpdateMutation,
} from "@fe/async-store/staff";
import useClinicStore from "@fe/store/clinicStore";
import { useUserInfo } from "@fe/store/userStore";
import {
	Alert,
	Button,
	Card,
	DatePicker,
	Descriptions,
	Drawer,
	Empty,
	Form,
	Input,
	InputNumber,
	Modal,
	Popconfirm,
	Result,
	Select,
	Skeleton,
	Space,
	Table,
	Tag,
	Tabs,
	Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { type Dayjs } from "dayjs";
import { useState } from "react";
import { toast } from "sonner";

type StaffFormValues = {
	staffCode: string;
	fullName: string;
	phone?: string;
	dateOfBirth?: Dayjs;
	gender?: "male" | "female" | "other" | "unknown";
	address?: string;
	jobTitleId?: number;
	specialtiesText?: string;
	employmentStatus?: "active" | "on_leave" | "terminated";
	startedAt?: Dayjs;
	endedAt?: Dayjs;
	note?: string;
	accountMode?: "new" | "existing";
	email?: string;
	username?: string;
	password?: string;
	existingUserId?: number;
	membershipStatus?: "invited" | "active" | "suspended" | "removed";
	roleIds?: number[];
};

function getErrorMessage(error: unknown) {
	if (error instanceof ApiClientError && error.status === 403) {
		return "You do not have permission to manage staff in this clinic.";
	}
	return error instanceof Error ? error.message : "Could not load staff.";
}

function labelEmployment(status: Staff["employmentStatus"]) {
	if (status === "on_leave") return "On leave";
	if (status === "terminated") return "Terminated";
	return "Active";
}

export default function StaffPage() {
	const userInfo = useUserInfo();
	const userId = userInfo.id === undefined ? null : String(userInfo.id);
	const clinicStore = useClinicStore();
	const hasClinicContext = Boolean(userId && clinicStore.userId === userId && clinicStore.activeClinicId !== null);

	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(20);
	const [searchInput, setSearchInput] = useState("");
	const [search, setSearch] = useState("");
	const [jobTitleId, setJobTitleId] = useState<number>();
	const [employmentStatus, setEmploymentStatus] = useState<Staff["employmentStatus"]>();
	const [membershipStatus, setMembershipStatus] = useState<Staff["membership"]["status"]>();
	const [editorOpen, setEditorOpen] = useState(false);
	const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
	const [detailId, setDetailId] = useState<number | null>(null);
	const [roleModalOpen, setRoleModalOpen] = useState(false);
	const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
	const [form] = Form.useForm<StaffFormValues>();

	const staffQuery = useStaffQuery({
		page,
		pageSize,
		search: search || undefined,
		jobTitleId,
		employmentStatus,
		membershipStatus,
	});
	const detailQuery = useStaffDetailQuery(detailId);
	const jobTitlesQuery = useStaffJobTitlesQuery(true);
	const rolesQuery = useRolesQuery();
	const createStaff = useStaffCreateMutation();
	const updateStaff = useStaffUpdateMutation();
	const profileStatus = useStaffProfileStatusMutation();
	const membershipStatusMutation = useStaffMembershipStatusMutation();
	const rolesMutation = useStaffRolesMutation();

	const showCreate = () => {
		setEditingStaff(null);
		form.resetFields();
		form.setFieldsValue({
			accountMode: "new",
			employmentStatus: "active",
			membershipStatus: "active",
		});
		setEditorOpen(true);
	};

	const showEdit = (staff: Staff) => {
		setEditingStaff(staff);
		form.setFieldsValue({
			staffCode: staff.staffCode,
			fullName: staff.fullName,
			phone: staff.phone ?? "",
			dateOfBirth: staff.dateOfBirth ? dayjs(staff.dateOfBirth) : undefined,
			gender: staff.gender ?? undefined,
			address: staff.address ?? "",
			jobTitleId: staff.jobTitle?.id,
			specialtiesText: staff.specialties.join(", "),
			startedAt: staff.startedAt ? dayjs(staff.startedAt) : undefined,
			endedAt: staff.endedAt ? dayjs(staff.endedAt) : undefined,
			note: staff.note ?? "",
		});
		setEditorOpen(true);
	};

	const submitForm = async (values: StaffFormValues) => {
		try {
			const specialties = values.specialtiesText
				?.split(",")
				.map(value => value.trim())
				.filter(Boolean);

			if (editingStaff) {
				const data: StaffUpdate = {
					staffCode: values.staffCode.trim(),
					fullName: values.fullName.trim(),
					phone: values.phone?.trim() || null,
					dateOfBirth: values.dateOfBirth?.format("YYYY-MM-DD") ?? null,
					gender: values.gender ?? null,
					address: values.address?.trim() || null,
					jobTitleId: values.jobTitleId ?? null,
					specialties,
					startedAt: values.startedAt?.format("YYYY-MM-DD") ?? null,
					endedAt: values.endedAt?.format("YYYY-MM-DD") ?? null,
					note: values.note?.trim() || null,
				};
				await updateStaff.mutateAsync({ membershipId: editingStaff.membershipId, data });
				toast.success("Staff member updated");
			} else {
				const account =
					values.accountMode === "existing"
						? { existingUserId: values.existingUserId! }
						: {
								user: {
									email: values.email!.trim(),
									username: values.username?.trim() || undefined,
									password: values.password!,
								},
							};
				const data: StaffCreate = {
					profile: {
						staffCode: values.staffCode.trim(),
						fullName: values.fullName.trim(),
						phone: values.phone?.trim() || null,
						dateOfBirth: values.dateOfBirth?.format("YYYY-MM-DD") ?? null,
						gender: values.gender ?? null,
						address: values.address?.trim() || null,
						jobTitleId: values.jobTitleId ?? null,
						specialties: specialties ?? [],
						employmentStatus: values.employmentStatus ?? "active",
						startedAt: values.startedAt?.format("YYYY-MM-DD") ?? null,
						endedAt: values.endedAt?.format("YYYY-MM-DD") ?? null,
						note: values.note?.trim() || null,
					},
					membership: {
						status: values.membershipStatus ?? "active",
						roleIds: values.roleIds ?? [],
						branchScope: "all",
					},
					...account,
				} as StaffCreate;
				await createStaff.mutateAsync(data);
				toast.success("Staff member created");
			}
			setEditorOpen(false);
		} catch (error) {
			toast.error(getErrorMessage(error));
		}
	};

	const changeProfileStatus = async (staff: Staff, status: Staff["employmentStatus"]) => {
		try {
			await profileStatus.mutateAsync({
				membershipId: staff.membershipId,
				data: {
					employmentStatus: status,
					endedAt: status === "terminated" ? dayjs().format("YYYY-MM-DD") : null,
				},
			});
			toast.success(`Employment status changed to ${labelEmployment(status)}`);
		} catch (error) {
			toast.error(getErrorMessage(error));
		}
	};

	const changeMembershipStatus = async (staff: Staff, status: Staff["membership"]["status"]) => {
		try {
			await membershipStatusMutation.mutateAsync({ membershipId: staff.membershipId, status });
			toast.success("Clinic membership status updated");
		} catch (error) {
			toast.error(getErrorMessage(error));
		}
	};

	const openRoles = (staff: Staff) => {
		setDetailId(staff.membershipId);
		setSelectedRoles(staff.roles.map(role => role.id));
		setRoleModalOpen(true);
	};

	const saveRoles = async () => {
		if (detailId === null) return;
		try {
			await rolesMutation.mutateAsync({ membershipId: detailId, roleIds: selectedRoles });
			toast.success("Staff roles updated");
			setRoleModalOpen(false);
		} catch (error) {
			toast.error(getErrorMessage(error));
		}
	};

	const columns: ColumnsType<Staff> = [
		{
			title: "Staff member",
			dataIndex: "fullName",
			key: "fullName",
			render: (name: string, staff) => (
				<div>
					<Button type="link" className="!p-0" onClick={() => setDetailId(staff.membershipId)}>{name}</Button>
					<div className="text-xs text-text-secondary">{staff.staffCode}</div>
				</div>
			),
		},
		{ title: "Job title", key: "jobTitle", render: (_, staff) => staff.jobTitle?.name ?? "-" },
		{ title: "Phone", dataIndex: "phone", key: "phone", render: value => value || "-" },
		{
			title: "Employment",
			dataIndex: "employmentStatus",
			key: "employmentStatus",
			render: (status: Staff["employmentStatus"]) => (
				<Tag color={status === "active" ? "success" : status === "on_leave" ? "warning" : "default"}>
					{labelEmployment(status)}
				</Tag>
		),
		},
		{
			title: "Membership",
			dataIndex: ["membership", "status"],
			key: "membershipStatus",
			render: (_value, staff) => (
				<Tag color={staff.membership.status === "active" ? "success" : "default"}>{staff.membership.status}</Tag>
			),
		},
		{
			title: "Actions",
			key: "actions",
			render: (_, staff) => (
				<Space wrap>
					<Button size="small" onClick={() => setDetailId(staff.membershipId)}>Details</Button>
					<Button size="small" onClick={() => showEdit(staff)}>Edit</Button>
					<Button size="small" onClick={() => openRoles(staff)}>Roles</Button>
					{staff.employmentStatus !== "terminated" ? (
						<Popconfirm
							title={`Terminate ${staff.fullName}?`}
							description="This stops employment at the clinic but does not deactivate the User account."
							onConfirm={() => void changeProfileStatus(staff, "terminated")}
						>
							<Button size="small" danger>Terminate</Button>
						</Popconfirm>
					) : (
						<Popconfirm title={`Deactivate clinic access for ${staff.fullName}?`} onConfirm={() => void changeMembershipStatus(staff, "removed")}>
							<Button size="small" danger disabled={staff.membership.status === "removed"}>Remove membership</Button>
						</Popconfirm>
					)}
				</Space>
			),
		},
	];

	if (!hasClinicContext) {
		return <Alert type="info" showIcon message="Select an active clinic before managing staff." />;
	}
	if (staffQuery.isError) {
		return (
			<Result
				status={staffQuery.error instanceof ApiClientError && staffQuery.error.status === 403 ? "403" : "error"}
				title="Staff unavailable"
				subTitle={getErrorMessage(staffQuery.error)}
				extra={<Button onClick={() => void staffQuery.refetch()}>Retry</Button>}
			/>
		);
	}

	return (
		<Space direction="vertical" size="large" className="w-full">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<Typography.Title level={2}>Staff</Typography.Title>
					<Typography.Paragraph type="secondary" className="!mb-0">
						Manage clinic-scoped staff profiles, membership, and roles.
					</Typography.Paragraph>
				</div>
				<Button type="primary" onClick={showCreate}>Add staff</Button>
			</div>

			<Card>
				<Space wrap className="mb-4">
					<Input.Search
						allowClear
						placeholder="Search name, code, email, or phone"
						value={searchInput}
						onChange={event => setSearchInput(event.target.value)}
						onSearch={value => { setSearch(value.trim()); setPage(1); }}
						className="w-72"
					/>
					<Select<number>
						allowClear
						placeholder="Job title"
						value={jobTitleId}
						onChange={value => { setJobTitleId(value); setPage(1); }}
						options={(jobTitlesQuery.data ?? []).map(title => ({ value: title.id, label: title.name }))}
						loading={jobTitlesQuery.isFetching}
						className="w-44"
					/>
					<Select<Staff["employmentStatus"]>
						allowClear
						placeholder="Employment status"
						value={employmentStatus}
						onChange={value => { setEmploymentStatus(value); setPage(1); }}
						options={[
							{ value: "active", label: "Active" },
							{ value: "on_leave", label: "On leave" },
							{ value: "terminated", label: "Terminated" },
						]}
						className="w-44"
					/>
					<Select<Staff["membership"]["status"]>
						allowClear
						placeholder="Membership status"
						value={membershipStatus}
						onChange={value => { setMembershipStatus(value); setPage(1); }}
						options={[
							{ value: "invited", label: "Invited" },
							{ value: "active", label: "Active" },
							{ value: "suspended", label: "Suspended" },
							{ value: "removed", label: "Removed" },
						]}
						className="w-44"
					/>
				</Space>

				{staffQuery.isPending ? <Skeleton active /> : (
					<Table<Staff>
						rowKey="membershipId"
						columns={columns}
						dataSource={staffQuery.data?.items ?? []}
						loading={staffQuery.isFetching}
						locale={{ emptyText: <Empty description="No staff match the current filters." /> }}
						pagination={{
							current: page,
							pageSize,
							total: staffQuery.data?.total ?? 0,
							showSizeChanger: true,
							onChange: (nextPage, nextPageSize) => { setPage(nextPage); setPageSize(nextPageSize); },
						}}
						scroll={{ x: 1000 }}
					/>
				)}
			</Card>

			<Modal
				title={editingStaff ? "Edit staff member" : "Add staff member"}
				open={editorOpen}
				onCancel={() => setEditorOpen(false)}
				onOk={() => form.submit()}
				confirmLoading={createStaff.isPending || updateStaff.isPending}
				destroyOnClose
				width={760}
			>
				<Form form={form} layout="vertical" onFinish={submitForm}>
					<Space size="large" className="w-full" wrap>
						<Form.Item name="staffCode" label="Staff code" rules={[{ required: true, whitespace: true }, { max: 50 }]} className="w-56">
							<Input maxLength={50} />
						</Form.Item>
						<Form.Item name="fullName" label="Full name" rules={[{ required: true, whitespace: true }, { max: 150 }]} className="w-72">
							<Input maxLength={150} />
						</Form.Item>
					</Space>
					<Space size="large" className="w-full" wrap>
						<Form.Item name="phone" label="Phone" rules={[{ max: 32 }]} className="w-56">
							<Input maxLength={32} />
						</Form.Item>
						<Form.Item name="dateOfBirth" label="Date of birth" className="w-56">
							<DatePicker className="w-full" format="DD/MM/YYYY" />
						</Form.Item>
						<Form.Item name="gender" label="Gender" className="w-40">
							<Select allowClear options={[
								{ value: "male", label: "Male" },
								{ value: "female", label: "Female" },
								{ value: "other", label: "Other" },
								{ value: "unknown", label: "Unknown" },
							]} />
						</Form.Item>
					</Space>
					<Form.Item name="address" label="Address" rules={[{ max: 500 }]}>
						<Input.TextArea rows={2} maxLength={500} />
					</Form.Item>
					<Space size="large" className="w-full" wrap>
						<Form.Item name="jobTitleId" label="Job title" className="w-56">
							<Select allowClear loading={jobTitlesQuery.isFetching} options={(jobTitlesQuery.data ?? []).map(title => ({ value: title.id, label: title.name }))} />
						</Form.Item>
						<Form.Item name="startedAt" label="Start date" className="w-56">
							<DatePicker className="w-full" format="DD/MM/YYYY" />
						</Form.Item>
						<Form.Item name="endedAt" label="End date" className="w-56">
							<DatePicker className="w-full" format="DD/MM/YYYY" />
						</Form.Item>
					</Space>
					<Form.Item name="specialtiesText" label="Specialties" extra="Separate specialties with commas">
						<Input placeholder="Surgery, Dermatology" />
					</Form.Item>
					<Form.Item name="note" label="Note" rules={[{ max: 5000 }]}>
						<Input.TextArea rows={2} maxLength={5000} />
					</Form.Item>

					{!editingStaff ? (
						<>
							<Space size="large" className="w-full" wrap>
								<Form.Item name="employmentStatus" label="Employment status" className="w-56">
									<Select options={[
										{ value: "active", label: "Active" },
										{ value: "on_leave", label: "On leave" },
										{ value: "terminated", label: "Terminated" },
									]} />
								</Form.Item>
								<Form.Item name="membershipStatus" label="Membership status" className="w-56">
									<Select options={[
										{ value: "invited", label: "Invited" },
										{ value: "active", label: "Active" },
										{ value: "suspended", label: "Suspended" },
										{ value: "removed", label: "Removed" },
									]} />
								</Form.Item>
							</Space>
							<Form.Item name="roleIds" label="Clinic roles">
								<Select mode="multiple" loading={rolesQuery.isFetching} options={(rolesQuery.data ?? []).filter(role => role.status !== false).map(role => ({ value: role.id, label: role.name || `Role ${role.id}` }))} />
							</Form.Item>
							<Form.Item name="accountMode" label="Account">
								<Select options={[{ value: "new", label: "Create a new User" }, { value: "existing", label: "Link an existing User" }]} />
							</Form.Item>
							<Form.Item noStyle shouldUpdate={(prev, current) => prev.accountMode !== current.accountMode}>
								{({ getFieldValue }) =>
									getFieldValue("accountMode") === "existing" ? (
										<Form.Item name="existingUserId" label="Existing User ID" rules={[{ required: true, message: "Enter an existing User ID" }]}>
											<InputNumber min={1} className="w-full" />
										</Form.Item>
									) : (
										<>
											<Space size="large" className="w-full" wrap>
												<Form.Item name="email" label="User email" rules={[{ required: true, type: "email" }, { max: 254 }]} className="w-72">
													<Input maxLength={254} />
												</Form.Item>
												<Form.Item name="username" label="Username" rules={[{ max: 150 }]} className="w-56">
													<Input maxLength={150} />
												</Form.Item>
											</Space>
											<Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }, { max: 50 }]} className="w-72">
												<Input.Password maxLength={50} />
											</Form.Item>
										</>
									)
								}
							</Form.Item>
						</>
					) : null}
				</Form>
			</Modal>

			<Drawer title="Staff details" open={detailId !== null && !roleModalOpen} onClose={() => setDetailId(null)} width={620}>
				{detailQuery.isPending ? <Skeleton active /> : detailQuery.isError ? (
					<Result
						status={detailQuery.error instanceof ApiClientError && detailQuery.error.status === 403 ? "403" : "error"}
						title="Staff details unavailable"
						subTitle={getErrorMessage(detailQuery.error)}
						extra={<Button onClick={() => void detailQuery.refetch()}>Retry</Button>}
					/>
				) : detailQuery.data ? (
					<Tabs items={[
						{
							key: "profile",
							label: "Profile",
							children: (
								<Descriptions bordered column={1} size="small">
									<Descriptions.Item label="Staff code">{detailQuery.data.staffCode}</Descriptions.Item>
									<Descriptions.Item label="Name">{detailQuery.data.fullName}</Descriptions.Item>
									<Descriptions.Item label="Phone">{detailQuery.data.phone || "-"}</Descriptions.Item>
									<Descriptions.Item label="Date of birth">{detailQuery.data.dateOfBirth ? dayjs(detailQuery.data.dateOfBirth).format("DD/MM/YYYY") : "-"}</Descriptions.Item>
									<Descriptions.Item label="Gender">{detailQuery.data.gender || "-"}</Descriptions.Item>
									<Descriptions.Item label="Address">{detailQuery.data.address || "-"}</Descriptions.Item>
									<Descriptions.Item label="Employment">{labelEmployment(detailQuery.data.employmentStatus)}</Descriptions.Item>
									<Descriptions.Item label="Start date">{detailQuery.data.startedAt ? dayjs(detailQuery.data.startedAt).format("DD/MM/YYYY") : "-"}</Descriptions.Item>
									<Descriptions.Item label="End date">{detailQuery.data.endedAt ? dayjs(detailQuery.data.endedAt).format("DD/MM/YYYY") : "-"}</Descriptions.Item>
									<Descriptions.Item label="Specialties">{detailQuery.data.specialties.join(", ") || "-"}</Descriptions.Item>
									<Descriptions.Item label="Note">{detailQuery.data.note || "-"}</Descriptions.Item>
								</Descriptions>
							),
						},
						{
							key: "account",
							label: "Account and roles",
							children: (
								<Descriptions bordered column={1} size="small">
									<Descriptions.Item label="User ID">{detailQuery.data.user.id}</Descriptions.Item>
									<Descriptions.Item label="Username">{detailQuery.data.user.username || "-"}</Descriptions.Item>
									<Descriptions.Item label="Email">{detailQuery.data.user.email || "-"}</Descriptions.Item>
									<Descriptions.Item label="User status">
										<Tag color={detailQuery.data.user.status ? "success" : "default"}>{detailQuery.data.user.status ? "Active" : "Inactive"}</Tag>
									</Descriptions.Item>
									<Descriptions.Item label="Membership">{detailQuery.data.membership.status}</Descriptions.Item>
									<Descriptions.Item label="Job title">{detailQuery.data.jobTitle?.name || "-"}</Descriptions.Item>
									<Descriptions.Item label="Roles">{detailQuery.data.roles.length ? detailQuery.data.roles.map(role => role.name || `Role ${role.id}`).join(", ") : "-"}</Descriptions.Item>
								</Descriptions>
							),
						},
					]} />
				) : null}
			</Drawer>

			<Modal title="Assign clinic roles" open={roleModalOpen} onCancel={() => setRoleModalOpen(false)} onOk={() => void saveRoles()} confirmLoading={rolesMutation.isPending}>
				<Select
					mode="multiple"
					className="w-full"
					loading={rolesQuery.isFetching}
					value={selectedRoles}
					onChange={setSelectedRoles}
					options={(rolesQuery.data ?? []).filter(role => role.status !== false).map(role => ({ value: role.id, label: role.name || `Role ${role.id}` }))}
				/>
			</Modal>
		</Space>
	);
}
