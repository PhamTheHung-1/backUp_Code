import { ApiClientError } from "@fe/async-store/apiClient";
import {
	type Owner,
	type OwnerCreate,
	type OwnerUpdate,
	useOwnerCreateMutation,
	useOwnerDetailQuery,
	useOwnersQuery,
	useOwnerUpdateMutation,
} from "@fe/async-store/owners";
import useClinicStore from "@fe/store/clinicStore";
import { useUserInfo } from "@fe/store/userStore";
import { useQueryClient } from "@tanstack/react-query";
import {
	Alert,
	Button,
	Card,
	Descriptions,
	Drawer,
	Empty,
	Form,
	Input,
	Modal,
	Popconfirm,
	Result,
	Select,
	Skeleton,
	Space,
	Table,
	Tag,
	Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";
import { toast } from "sonner";

type OwnerFormValues = OwnerCreate;

function getErrorMessage(error: unknown) {
	if (error instanceof ApiClientError && error.status === 403) return "You do not have permission to access owners in this clinic.";
	return error instanceof Error ? error.message : "Could not load owners.";
}

function statusFilterValue(value: string): boolean | undefined {
	if (value === "active") return true;
	if (value === "inactive") return false;
	return undefined;
}

export default function OwnersPage() {
	const userInfo = useUserInfo();
	const userId = userInfo.id === undefined ? null : String(userInfo.id);
	const clinicStore = useClinicStore();
	const hasClinicContext = Boolean(userId && clinicStore.userId === userId && clinicStore.activeClinicId !== null);
	const queryClient = useQueryClient();
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(20);
	const [searchInput, setSearchInput] = useState("");
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [form] = Form.useForm<OwnerFormValues>();
	const [editorOpen, setEditorOpen] = useState(false);
	const [editingOwner, setEditingOwner] = useState<Owner | null>(null);
	const [detailId, setDetailId] = useState<number | null>(null);
	const ownersQuery = useOwnersQuery({
		page,
		pageSize,
		search: search || undefined,
		status: statusFilterValue(statusFilter),
	});
	const detailQuery = useOwnerDetailQuery(detailId);
	const createOwner = useOwnerCreateMutation();
	const updateOwner = useOwnerUpdateMutation();
	const invalidateOwners = () => queryClient.invalidateQueries({ queryKey: ["clinic-scoped", "owners", userId ?? "anonymous"] });

	const showCreate = () => {
		setEditingOwner(null);
		form.resetFields();
		form.setFieldsValue({ fullName: "", phone: "", email: "", address: "" });
		setEditorOpen(true);
	};

	const showEdit = (owner: Owner) => {
		setEditingOwner(owner);
		form.setFieldsValue({
			fullName: owner.fullName,
			phone: owner.phone ?? "",
			email: owner.email ?? "",
			address: owner.address ?? "",
		});
		setEditorOpen(true);
	};

	const submitForm = async (values: OwnerFormValues) => {
		const data: OwnerCreate = {
			fullName: values.fullName.trim(),
			phone: values.phone?.trim() || undefined,
			email: values.email?.trim() || undefined,
			address: values.address?.trim() || undefined,
		};
		try {
			if (editingOwner) {
				await updateOwner.mutateAsync({ id: editingOwner.id, data: data satisfies OwnerUpdate });
				toast.success("Owner updated");
			} else {
				await createOwner.mutateAsync(data);
				toast.success("Owner created");
			}
			setEditorOpen(false);
			await invalidateOwners();
		} catch (error) {
			toast.error(getErrorMessage(error));
		}
	};

	const toggleStatus = async (owner: Owner) => {
		try {
			await updateOwner.mutateAsync({ id: owner.id, data: { status: !owner.status } });
			toast.success(owner.status ? "Owner deactivated" : "Owner activated");
			await invalidateOwners();
			if (detailId === owner.id) await detailQuery.refetch();
		} catch (error) {
			toast.error(getErrorMessage(error));
		}
	};

	const columns: ColumnsType<Owner> = [
		{
			title: "Owner",
			dataIndex: "fullName",
			key: "fullName",
			render: (name: string, owner) => (
				<div>
					<Button type="link" className="!p-0" onClick={() => setDetailId(owner.id)}>
						{name}
					</Button>
					<div className="text-xs text-text-secondary">{owner.email || owner.phone || "No contact details"}</div>
				</div>
			),
		},
		{ title: "Phone", dataIndex: "phone", key: "phone", render: value => value || "-" },
		{ title: "Email", dataIndex: "email", key: "email", render: value => value || "-" },
		{
			title: "Status",
			dataIndex: "status",
			key: "status",
			render: (active: boolean, owner) => (
				<Popconfirm
					title={`${active ? "Deactivate" : "Activate"} ${owner.fullName}?`}
					description={active ? "The owner and their pet records will be retained." : undefined}
					onConfirm={() => toggleStatus(owner)}
					okText="Confirm"
					cancelText="Cancel"
				>
					<Tag color={active ? "success" : "default"} className="cursor-pointer">
						{active ? "Active" : "Inactive"}
					</Tag>
				</Popconfirm>
			),
		},
		{
			title: "Actions",
			key: "actions",
			render: (_, owner) => (
				<Space>
					<Button size="small" onClick={() => setDetailId(owner.id)}>
						Details
					</Button>
					<Button size="small" onClick={() => showEdit(owner)}>
						Edit
					</Button>
				</Space>
			),
		},
	];

	if (ownersQuery.isError) {
		return (
			<Result
				status={ownersQuery.error instanceof ApiClientError && ownersQuery.error.status === 403 ? "403" : "error"}
				title="Owners unavailable"
				subTitle={getErrorMessage(ownersQuery.error)}
				extra={<Button onClick={() => void ownersQuery.refetch()}>Retry</Button>}
			/>
		);
	}

	if (!hasClinicContext) {
		return <Alert type="info" showIcon message="Select an active clinic before managing owners." />;
	}

	return (
		<Space direction="vertical" size="large" className="w-full">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<Typography.Title level={2}>Owners</Typography.Title>
					<Typography.Paragraph type="secondary" className="!mb-0">
						Owner records are scoped to the active clinic. Deactivation retains linked pet records.
					</Typography.Paragraph>
				</div>
				<Button type="primary" onClick={showCreate}>
					Add owner
				</Button>
			</div>

			<Card>
				<Space wrap className="mb-4">
					<Input.Search
						allowClear
						placeholder="Search name, phone, or email"
						value={searchInput}
						onChange={event => setSearchInput(event.target.value)}
						onSearch={value => {
							setSearch(value.trim());
							setPage(1);
						}}
						className="w-72"
					/>
					<Select
						aria-label="Owner status"
						value={statusFilter}
						onChange={value => {
							setStatusFilter(value);
							setPage(1);
						}}
						options={[
							{ label: "All statuses", value: "all" },
							{ label: "Active", value: "active" },
							{ label: "Inactive", value: "inactive" },
						]}
						className="w-40"
					/>
				</Space>

				{ownersQuery.isPending ? (
					<Skeleton active />
				) : (
					<Table<Owner>
						rowKey="id"
						columns={columns}
						dataSource={ownersQuery.data?.items ?? []}
						loading={ownersQuery.isFetching}
						locale={{ emptyText: <Empty description="No owners match the current filters." /> }}
						pagination={{
							current: page,
							pageSize,
							total: ownersQuery.data?.total ?? 0,
							showSizeChanger: true,
							onChange: (nextPage, nextPageSize) => {
								setPage(nextPage);
								setPageSize(nextPageSize);
							},
						}}
					/>
				)}
			</Card>

			<Modal
				title={editingOwner ? "Edit owner" : "Add owner"}
				open={editorOpen}
				onCancel={() => setEditorOpen(false)}
				onOk={() => form.submit()}
				confirmLoading={createOwner.isPending || updateOwner.isPending}
				destroyOnClose
			>
				<Form form={form} layout="vertical" onFinish={submitForm}>
					<Form.Item
						name="fullName"
						label="Full name"
						rules={[{ required: true, whitespace: true, message: "Enter the owner's name" }, { max: 150 }]}
					>
						<Input maxLength={150} autoComplete="name" />
					</Form.Item>
					<Form.Item name="phone" label="Phone" rules={[{ max: 32 }]}>
						<Input maxLength={32} autoComplete="tel" />
					</Form.Item>
					<Form.Item name="email" label="Email" rules={[{ type: "email", message: "Enter a valid email" }, { max: 254 }]}>
						<Input maxLength={254} autoComplete="email" />
					</Form.Item>
					<Form.Item name="address" label="Address" rules={[{ max: 500 }]}>
						<Input.TextArea maxLength={500} rows={3} autoComplete="street-address" />
					</Form.Item>
				</Form>
			</Modal>

			<Drawer title="Owner details" open={detailId !== null} onClose={() => setDetailId(null)} width={560}>
				{detailQuery.isPending ? (
					<Skeleton active />
				) : detailQuery.isError ? (
					<Result
						status={detailQuery.error instanceof ApiClientError && detailQuery.error.status === 403 ? "403" : "error"}
						title="Owner details unavailable"
						subTitle={getErrorMessage(detailQuery.error)}
						extra={<Button onClick={() => void detailQuery.refetch()}>Retry</Button>}
					/>
				) : detailQuery.data ? (
					<Descriptions bordered column={1}>
						<Descriptions.Item label="Name">{detailQuery.data.fullName}</Descriptions.Item>
						<Descriptions.Item label="Status">
							<Tag color={detailQuery.data.status ? "success" : "default"}>{detailQuery.data.status ? "Active" : "Inactive"}</Tag>
						</Descriptions.Item>
						<Descriptions.Item label="Phone">{detailQuery.data.phone || "-"}</Descriptions.Item>
						<Descriptions.Item label="Email">{detailQuery.data.email || "-"}</Descriptions.Item>
						<Descriptions.Item label="Address">{detailQuery.data.address || "-"}</Descriptions.Item>
					</Descriptions>
				) : (
					<Alert type="info" message="Select an owner to view details." />
				)}
			</Drawer>
		</Space>
	);
}
