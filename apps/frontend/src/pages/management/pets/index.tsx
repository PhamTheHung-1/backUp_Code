import type { PetUpdate as PetUpdateBody } from "@be/modules/pets/pets.schema";
import { ApiClientError } from "@fe/async-store/apiClient";
import { useOwnersQuery } from "@fe/async-store/owners";
import {
	type Pet,
	type PetCreate,
	usePetCreateMutation,
	usePetDetailQuery,
	usePetsQuery,
	usePetUpdateMutation,
} from "@fe/async-store/pets";
import useClinicStore from "@fe/store/clinicStore";
import { useUserInfo } from "@fe/store/userStore";
import { useQueryClient } from "@tanstack/react-query";
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
import dayjs, { type Dayjs } from "dayjs";
import { useState } from "react";
import { toast } from "sonner";

type PetFormValues = {
	ownerId: number;
	name: string;
	species: string;
	sex?: "male" | "female" | "unknown";
	breed?: string;
	dateOfBirth?: Dayjs;
	color?: string;
	microchipNumber?: string;
};

function getErrorMessage(error: unknown) {
	if (error instanceof ApiClientError && error.status === 403) {
		return "You do not have permission to access pets in this clinic.";
	}
	return error instanceof Error ? error.message : "Could not load pets.";
}

function statusFilterValue(value: string): boolean | undefined {
	if (value === "active") return true;
	if (value === "inactive") return false;
	return undefined;
}

function sexLabel(value: string | null | undefined) {
	if (value === "male") return "Male";
	if (value === "female") return "Female";
	return "Unknown";
}

function sexFormValue(value: string | null | undefined): "male" | "female" | "unknown" {
	if (value === "male" || value === "female") return value;
	return "unknown";
}

export default function PetsPage() {
	const userInfo = useUserInfo();
	const userId = userInfo.id === undefined ? null : String(userInfo.id);
	const clinicStore = useClinicStore();
	const hasClinicContext = Boolean(userId && clinicStore.userId === userId && clinicStore.activeClinicId !== null);
	const queryClient = useQueryClient();

	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(20);
	const [searchInput, setSearchInput] = useState("");
	const [search, setSearch] = useState("");
	const [speciesFilter, setSpeciesFilter] = useState("");
	const [sexFilter, setSexFilter] = useState<"male" | "female" | "unknown" | undefined>();
	const [statusFilter, setStatusFilter] = useState("all");
	const [form] = Form.useForm<PetFormValues>();
	const [editorOpen, setEditorOpen] = useState(false);
	const [editingPet, setEditingPet] = useState<Pet | null>(null);
	const [detailId, setDetailId] = useState<number | null>(null);

	const petsQuery = usePetsQuery({
		page,
		pageSize,
		search: search || undefined,
		species: speciesFilter.trim() || undefined,
		sex: sexFilter,
		status: statusFilterValue(statusFilter),
	});
	const ownersQuery = useOwnersQuery({ page: 1, pageSize: 100, status: true });
	const detailQuery = usePetDetailQuery(detailId);
	const createPet = usePetCreateMutation();
	const updatePet = usePetUpdateMutation();

	const invalidatePets = async () => {
		await queryClient.invalidateQueries({ queryKey: ["clinic-scoped", "pets", userId ?? "anonymous"] });
		await queryClient.invalidateQueries({ queryKey: ["clinic-scoped", "pet", userId ?? "anonymous"] });
	};

	const showCreate = () => {
		setEditingPet(null);
		form.resetFields();
		setEditorOpen(true);
	};

	const showEdit = (pet: Pet) => {
		setEditingPet(pet);
		form.setFieldsValue({
			ownerId: pet.ownerId,
			name: pet.name,
			species: pet.species,
			sex: sexFormValue(pet.sex),
			breed: pet.breed ?? "",
			dateOfBirth: pet.dateOfBirth ? dayjs(pet.dateOfBirth) : undefined,
			color: pet.color ?? "",
			microchipNumber: pet.microchipNumber ?? "",
		});
		setEditorOpen(true);
	};

	const submitForm = async (values: PetFormValues) => {
		const data = {
			ownerId: values.ownerId,
			name: values.name.trim(),
			species: values.species.trim(),
			sex: values.sex,
			breed: values.breed?.trim() || undefined,
			dateOfBirth: values.dateOfBirth?.format("YYYY-MM-DD"),
			color: values.color?.trim() || undefined,
			microchipNumber: values.microchipNumber?.trim() || undefined,
		} satisfies PetCreate | PetUpdateBody;

		try {
			if (editingPet) {
				await updatePet.mutateAsync({ id: editingPet.id, data: data as PetUpdateBody });
				toast.success("Pet updated");
			} else {
				await createPet.mutateAsync(data as PetCreate);
				toast.success("Pet created");
			}
			setEditorOpen(false);
			await invalidatePets();
		} catch (error) {
			toast.error(getErrorMessage(error));
		}
	};

	const toggleStatus = async (pet: Pet) => {
		try {
			await updatePet.mutateAsync({ id: pet.id, data: { status: !pet.status } });
			toast.success(pet.status ? "Pet deactivated" : "Pet activated");
			await invalidatePets();
		} catch (error) {
			toast.error(getErrorMessage(error));
		}
	};

	const ownerOptions = (ownersQuery.data?.items ?? []).map(owner => ({
		value: owner.id,
		label: owner.fullName + (owner.phone ? ` · ${owner.phone}` : ""),
	}));

	const columns: ColumnsType<Pet> = [
		{
			title: "Pet",
			dataIndex: "name",
			key: "name",
			render: (name: string, pet) => (
				<div>
					<Button type="link" className="!p-0" onClick={() => setDetailId(pet.id)}>
						{name}
					</Button>
					<div className="text-xs text-text-secondary">{pet.petCode}</div>
				</div>
		),
		},
		{ title: "Owner", dataIndex: "ownerName", key: "ownerName" },
		{ title: "Owner phone", dataIndex: "ownerPhone", key: "ownerPhone", render: value => value || "-" },
		{ title: "Species", dataIndex: "species", key: "species" },
		{ title: "Breed", dataIndex: "breed", key: "breed", render: value => value || "-" },
		{ title: "Sex", dataIndex: "sex", key: "sex", render: value => sexLabel(value) },
		{
			title: "Date of birth",
			dataIndex: "dateOfBirth",
			key: "dateOfBirth",
			render: value => (value ? dayjs(value).format("DD/MM/YYYY") : "-"),
		},
		{
			title: "Status",
			dataIndex: "status",
			key: "status",
			render: (active: boolean, pet) => (
				<Popconfirm
					title={`${active ? "Deactivate" : "Activate"} ${pet.name}?`}
					onConfirm={() => void toggleStatus(pet)}
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
			render: (_, pet) => (
				<Space>
					<Button size="small" onClick={() => setDetailId(pet.id)}>
						Details
					</Button>
					<Button size="small" onClick={() => showEdit(pet)}>
						Edit
					</Button>
				</Space>
			),
		},
	];

	if (petsQuery.isError) {
		return (
			<Result
				status={petsQuery.error instanceof ApiClientError && petsQuery.error.status === 403 ? "403" : "error"}
				title="Pets unavailable"
				subTitle={getErrorMessage(petsQuery.error)}
				extra={<Button onClick={() => void petsQuery.refetch()}>Retry</Button>}
			/>
		);
	}

	if (!hasClinicContext) {
		return <Alert type="info" showIcon message="Select an active clinic before managing pets." />;
	}

	return (
		<Space direction="vertical" size="large" className="w-full">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<Typography.Title level={2}>Pets</Typography.Title>
					<Typography.Paragraph type="secondary" className="!mb-0">
						Pet records and their owners are scoped to the active clinic.
					</Typography.Paragraph>
				</div>
				<Button type="primary" onClick={showCreate}>
					Add pet
				</Button>
			</div>

			<Card>
				<Space wrap className="mb-4">
					<Input.Search
						allowClear
						placeholder="Search pet, code, owner, or breed"
						value={searchInput}
						onChange={event => setSearchInput(event.target.value)}
						onSearch={value => {
							setSearch(value.trim());
							setPage(1);
						}}
						className="w-72"
					/>
					<Input
						allowClear
						placeholder="Species"
						value={speciesFilter}
						onChange={event => {
							setSpeciesFilter(event.target.value);
							setPage(1);
						}}
						className="w-40"
					/>
					<Select
						aria-label="Pet sex"
						allowClear
						placeholder="Sex"
						value={sexFilter}
						onChange={value => {
							setSexFilter(value);
							setPage(1);
						}}
						options={[
							{ label: "Male", value: "male" },
							{ label: "Female", value: "female" },
							{ label: "Unknown", value: "unknown" },
						]}
						className="w-36"
					/>
					<Select
						aria-label="Pet status"
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

				{petsQuery.isPending ? (
					<Skeleton active />
				) : (
					<Table<Pet>
						rowKey="id"
						columns={columns}
						dataSource={petsQuery.data?.items ?? []}
						loading={petsQuery.isFetching}
						locale={{ emptyText: <Empty description="No pets match the current filters." /> }}
						pagination={{
							current: page,
							pageSize,
							total: petsQuery.data?.total ?? 0,
							showSizeChanger: true,
							onChange: (nextPage, nextPageSize) => {
								setPage(nextPage);
								setPageSize(nextPageSize);
							},
						}}
						scroll={{ x: 1100 }}
					/>
				)}
			</Card>

			<Modal
				title={editingPet ? "Edit pet" : "Add pet"}
				open={editorOpen}
				onCancel={() => setEditorOpen(false)}
				onOk={() => form.submit()}
				confirmLoading={createPet.isPending || updatePet.isPending}
				destroyOnClose
			>
				<Form form={form} layout="vertical" onFinish={submitForm}>
					<Form.Item name="ownerId" label="Owner" rules={[{ required: true, message: "Select an owner" }]}>
						<Select
							showSearch
							optionFilterProp="label"
							placeholder="Search clinic owners"
							options={ownerOptions}
							loading={ownersQuery.isFetching}
							notFoundContent={ownersQuery.isError ? "Could not load owners" : "No owners found"}
						/>
					</Form.Item>
					<Form.Item name="name" label="Name" rules={[{ required: true, whitespace: true }, { max: 150 }]}>
						<Input maxLength={150} />
					</Form.Item>
					<Form.Item name="species" label="Species" rules={[{ required: true, whitespace: true }, { max: 80 }]}>
						<Input maxLength={80} placeholder="Dog, Cat..." />
					</Form.Item>
					<Form.Item name="sex" label="Sex" initialValue="unknown">
						<Select
							options={[
								{ label: "Male", value: "male" },
								{ label: "Female", value: "female" },
								{ label: "Unknown", value: "unknown" },
							]}
						/>
					</Form.Item>
					<Form.Item name="breed" label="Breed">
						<Input maxLength={120} />
					</Form.Item>
					<Form.Item name="dateOfBirth" label="Date of birth">
						<DatePicker className="w-full" format="DD/MM/YYYY" disabledDate={value => value.isAfter(dayjs(), "day")} />
					</Form.Item>
					<Form.Item name="color" label="Color">
						<Input maxLength={80} />
					</Form.Item>
					<Form.Item name="microchipNumber" label="Microchip number">
						<Input maxLength={64} />
					</Form.Item>
				</Form>
			</Modal>

			<Drawer title="Pet details" open={detailId !== null} onClose={() => setDetailId(null)} width={560}>
				{detailQuery.isPending ? (
					<Skeleton active />
				) : detailQuery.isError ? (
					<Result
						status={detailQuery.error instanceof ApiClientError && detailQuery.error.status === 403 ? "403" : "error"}
						title="Pet details unavailable"
						subTitle={getErrorMessage(detailQuery.error)}
						extra={<Button onClick={() => void detailQuery.refetch()}>Retry</Button>}
					/>
				) : detailQuery.data ? (
					<Descriptions bordered column={1}>
						<Descriptions.Item label="Code">{detailQuery.data.petCode}</Descriptions.Item>
						<Descriptions.Item label="Name">{detailQuery.data.name}</Descriptions.Item>
						<Descriptions.Item label="Owner">{detailQuery.data.ownerName}</Descriptions.Item>
						<Descriptions.Item label="Owner phone">{detailQuery.data.ownerPhone || "-"}</Descriptions.Item>
						<Descriptions.Item label="Species">{detailQuery.data.species}</Descriptions.Item>
						<Descriptions.Item label="Breed">{detailQuery.data.breed || "-"}</Descriptions.Item>
						<Descriptions.Item label="Sex">{sexLabel(detailQuery.data.sex)}</Descriptions.Item>
						<Descriptions.Item label="Date of birth">
							{detailQuery.data.dateOfBirth ? dayjs(detailQuery.data.dateOfBirth).format("DD/MM/YYYY") : "-"}
						</Descriptions.Item>
						<Descriptions.Item label="Color">{detailQuery.data.color || "-"}</Descriptions.Item>
						<Descriptions.Item label="Microchip">{detailQuery.data.microchipNumber || "-"}</Descriptions.Item>
						<Descriptions.Item label="Status">
							<Tag color={detailQuery.data.status ? "success" : "default"}>
								{detailQuery.data.status ? "Active" : "Inactive"}
							</Tag>
						</Descriptions.Item>
					</Descriptions>
				) : (
					<Alert type="info" message="Select a pet to view details." />
				)}
			</Drawer>
		</Space>
	);
}
