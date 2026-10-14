import { useRolesQuery } from "@fe/async-store/role";
import { type UserItem, useDeleteUserMutation, useUserMutation, useUsersQuery } from "@fe/async-store/user";
import { IconButton, Iconify } from "@fe/components/icon";
import { usePathname, useRouter } from "@fe/router/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Card, Popconfirm, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";
import { toast } from "sonner";
import { UserModal } from "./user-modal";

const DEFAULT_USER_VALUE: Partial<UserItem> = {
	email: "",
	username: "",
	status: true,
	roles: [],
};

export default function UserPage() {
	const { push } = useRouter();
	const pathname = usePathname();
	const queryClient = useQueryClient();

	const { data: users, isLoading } = useUsersQuery();
	const { data: roles } = useRolesQuery();
	const userMutation = useUserMutation();
	const deleteMutation = useDeleteUserMutation();

	const [modalVisible, setModalVisible] = useState(false);
	const [modalTitle, setModalTitle] = useState("");
	const [formValue, setFormValue] = useState<Partial<UserItem>>({});

	// Ánh xạ nhanh từ roleId -> roleName
	const roleMap = new Map((roles || []).map(r => [r.id, r.name]));

	const onCreate = () => {
		setModalTitle("Create New User");
		setFormValue({ ...DEFAULT_USER_VALUE });
		setModalVisible(true);
	};

	const onEdit = (record: UserItem) => {
		setModalTitle("Edit User");
		setFormValue({ ...record });
		setModalVisible(true);
	};

	const onSave = async (userDto: any) => {
		try {
			await userMutation.mutateAsync(userDto);
			setModalVisible(false);
			toast.success(userDto.id ? "User updated successfully" : "User created successfully");
			queryClient.invalidateQueries({ queryKey: ["users"] });
		} catch (err: any) {
			toast.error(err.message || "Operation failed");
		}
	};

	const onDelete = async (id: number) => {
		try {
			await deleteMutation.mutateAsync(id);
			toast.success("User deleted successfully");
			queryClient.invalidateQueries({ queryKey: ["users"] });
		} catch (err: any) {
			toast.error(err.message || "Failed to delete user");
		}
	};

	const onToggleStatus = async (record: UserItem) => {
		try {
			await userMutation.mutateAsync({
				id: record.id,
				status: !record.status,
			});
			toast.success("User status updated");
			queryClient.invalidateQueries({ queryKey: ["users"] });
		} catch (err: any) {
			toast.error(err.message || "Failed to update status");
		}
	};

	const columns: ColumnsType<UserItem> = [
		{
			title: "Name",
			dataIndex: "email",
			width: 280,
			render: (_, record) => {
				const displayName = record.username || (record.email ? record.email.split("@")[0] : `User #${record.id}`);
				const avatarSrc = record.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${displayName}`;
				return (
					<div className="flex items-center">
						<img alt="" src={avatarSrc} className="h-10 w-10 rounded-full bg-gray-100 object-cover" />
						<div className="ml-2 flex flex-col">
							<span className="text-sm font-medium">{displayName}</span>
							<span className="text-xs text-text-secondary">{record.email || "-"}</span>
						</div>
					</div>
				);
			},
		},
		{
			title: "Roles",
			dataIndex: "roles",
			align: "center",
			width: 200,
			render: (roleIds: number[] | null) => (
				<div className="flex flex-wrap justify-center gap-1">
					{roleIds && roleIds.length > 0 ? (
						roleIds.map(id => (
							<Tag color="cyan" key={id}>
								{roleMap.get(id) || `Role #${id}`}
							</Tag>
						))
					) : (
						<Tag color="default">No Role</Tag>
					)}
				</div>
			),
		},
		{
			title: "Status",
			dataIndex: "status",
			align: "center",
			width: 120,
			render: (status: boolean, record) => (
				<Popconfirm
					title={status ? `Disable ${record.username || record.email || record.id}?` : `Enable ${record.username || record.email || record.id}?`}
					onConfirm={() => onToggleStatus(record)}
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
		{
			title: "Created At",
			dataIndex: "createdAt",
			width: 180,
			render: val => (val ? new Date(val).toLocaleDateString() : "-"),
		},
		{
			title: "Action",
			key: "operation",
			align: "center",
			width: 130,
			render: (_, record) => (
				<div className="flex w-full justify-center text-gray-500">
					<IconButton onClick={() => push(`${pathname}/${record.id}`)} title="View Detail">
						<Iconify icon="mdi:card-account-details" size={18} />
					</IconButton>
					<IconButton onClick={() => onEdit(record)} title="Edit User">
						<Iconify icon="solar:pen-bold-duotone" size={18} />
					</IconButton>
					<Popconfirm
						title="Delete the User"
						description={`Are you sure you want to delete ${record.username || record.email || record.id}?`}
						onConfirm={() => onDelete(record.id)}
						okText="Yes"
						cancelText="No"
						placement="left"
					>
						<IconButton title="Delete User">
							<Iconify icon="mingcute:delete-2-fill" size={18} className="text-error" />
						</IconButton>
					</Popconfirm>
				</div>
			),
		},
	];

	return (
		<Card
			title="User List"
			extra={
				<Button type="primary" onClick={onCreate}>
					New
				</Button>
			}
		>
			<Table<UserItem>
				rowKey="id"
				size="small"
				scroll={{ x: "max-content" }}
				pagination={false}
				loading={isLoading}
				columns={columns}
				dataSource={users || []}
			/>

			<UserModal show={modalVisible} title={modalTitle} formValue={formValue} roles={roles} onSave={onSave} onCancel={() => setModalVisible(false)} />
		</Card>
	);
}
