import { useMenusQuery } from "@fe/async-store/menu";
import { type CreateRoleType, useApiList, useRoleMutation, useRolesQuery } from "@fe/async-store/role";
import { IconButton, Iconify } from "@fe/components/icon";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Card, Popconfirm, Tag } from "antd";
import Table, { type ColumnsType } from "antd/es/table";
import { useState } from "react";
import { RoleModal } from "./role-modal";

const DEFAULE_ROLE_VALUE: CreateRoleType = {
	name: "",
	desc: "",
	status: true,
};

export default function RolePage() {
	const queryClient = useQueryClient();
	const { data: menus } = useMenusQuery();
	const { data: roles } = useRolesQuery();
	const { data: apis } = useApiList();
	const roleMutation = useRoleMutation();
	const [formValue, setFormValue] = useState({});
	const [show, setShow] = useState(false);
	const [title, setTitle] = useState("");
	const [selectedRoleId, setSelectedRoleId] = useState<number | undefined>(undefined);

	const onSave = async (role: CreateRoleType) => {
		role.id = selectedRoleId;
		await roleMutation.mutateAsync(role);
		setShow(false);
		queryClient.invalidateQueries({ queryKey: ["roles"] });
	};

	const onCancel = () => {
		setShow(false);
	};

	const columns: ColumnsType<CreateRoleType> = [
		{
			title: "Name",
			dataIndex: "name",
			width: 300,
		},
		{
			title: "Status",
			dataIndex: "status",
			align: "center",
			width: 120,
			render: (status, record) => (
				<Popconfirm
					title={status ? `Disable ${record.name}?` : `Enable ${record.name}?`}
					onConfirm={async () => {
						await roleMutation.mutateAsync({
							id: record.id,
							status: !record.status,
						});
						queryClient.invalidateQueries({ queryKey: ["roles"] });
					}}
					okText="Yes"
					cancelText="No"
					placement="left"
				>
					<Tag color={status ? "success" : "error"} style={{ cursor: "pointer" }}>
						{status ? "Enable" : "Disable"}
					</Tag>
				</Popconfirm>
			),
		},
		{ title: "Desc", dataIndex: "desc" },
		{
			title: "Created At",
			dataIndex: "createdAt",
			width: 300,
			render: (v, _) => v.toLocaleDateString(),
		},
		{
			title: "Action",
			key: "operation",
			align: "center",
			width: 100,
			render: (_, record) => (
				<div className="flex w-full justify-center text-gray">
					<IconButton onClick={() => onEdit(record)}>
						<Iconify icon="solar:pen-bold-duotone" size={18} />
					</IconButton>
					{/* <Popconfirm
						title="Delete the Role"
						okText="Yes"
						cancelText="No"
						placement="left"
					>
						<IconButton>
							<Iconify
								icon="mingcute:delete-2-fill"
								size={18}
								className="text-error"
							/>
						</IconButton>
					</Popconfirm> */}
				</div>
			),
		},
	];

	const onCreate = () => {
		setTitle("Create New");
		setFormValue({ ...DEFAULE_ROLE_VALUE });
		setSelectedRoleId(undefined);
		setShow(true);
	};

	const onEdit = (formValue: CreateRoleType) => {
		setSelectedRoleId(formValue.id);
		setFormValue(formValue);
		setTitle("Edit");
		setShow(true);
	};

	return (
		<Card
			title="Role List"
			extra={
				<Button type="primary" onClick={onCreate}>
					New
				</Button>
			}
		>
			<Table rowKey="id" size="small" scroll={{ x: "max-content" }} pagination={false} columns={columns} dataSource={roles} />

			<RoleModal apis={apis || []} menus={menus} onCancel={onCancel} onSave={onSave} formValue={formValue} show={show} title={title} />
		</Card>
	);
}
