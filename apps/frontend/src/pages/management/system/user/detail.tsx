import { useRolesQuery } from "@fe/async-store/role";
import { useUserDetailQuery, useUsersQuery } from "@fe/async-store/user";
import Card from "@fe/components/card";
import { Iconify } from "@fe/components/icon";
import { useParams, useRouter } from "@fe/router/hooks";
import { Button, Descriptions, Empty, Spin, Tag, Typography } from "antd";

export default function UserDetail() {
	const { id } = useParams();
	const { back } = useRouter();
	const userId = Number(id);

	// Thử query detail theo ID, nếu chưa có thì fallback tìm trong danh sách users
	const { data: detailUser, isLoading: isDetailLoading } = useUserDetailQuery(userId);
	const { data: users, isLoading: isListLoading } = useUsersQuery();
	const { data: roles } = useRolesQuery();

	const isLoading = isDetailLoading && isListLoading;
	const user = detailUser || (users || []).find(u => u.id === userId);

	const roleMap = new Map((roles || []).map(r => [r.id, r.name]));

	if (isLoading) {
		return (
			<Card className="flex items-center justify-center p-12">
				<Spin size="large" />
			</Card>
		);
	}

	if (!user) {
		return (
			<Card className="flex flex-col items-center justify-center p-12">
				<Empty description={`User with ID ${id} not found`} />
				<Button type="primary" onClick={() => back()} className="mt-4">
					Back to User List
				</Button>
			</Card>
		);
	}

	const displayName = user.username || (user.email ? user.email.split("@")[0] : `User #${user.id}`);
	const avatarSrc = user.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${displayName}`;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<Button icon={<Iconify icon="eva:arrow-back-fill" />} onClick={() => back()}>
					Back
				</Button>
			</div>

			<Card className="w-full flex-col !items-start">
				<Typography.Title level={5} className="!mb-6">
					User Details
				</Typography.Title>
				<div className="mb-6 flex items-center gap-4">
					<img alt="" src={avatarSrc} className="h-16 w-16 rounded-full bg-gray-100 object-cover" />
					<div className="flex flex-col">
						<span className="text-xl font-semibold">{displayName}</span>
						<span className="text-sm text-text-secondary">{user.email || "-"}</span>
					</div>
				</div>

				<Descriptions bordered column={{ xs: 1, sm: 2, md: 2 }} className="w-full">
					<Descriptions.Item label="User ID">{user.id}</Descriptions.Item>
					<Descriptions.Item label="Status">
						<Tag color={user.status ? "success" : "error"}>{user.status ? "Enable" : "Disable"}</Tag>
					</Descriptions.Item>
					<Descriptions.Item label="Email">{user.email || "-"}</Descriptions.Item>
					<Descriptions.Item label="Username">{user.username || "-"}</Descriptions.Item>
					<Descriptions.Item label="Roles" span={2}>
						<div className="flex flex-wrap gap-1">
							{user.roles && user.roles.length > 0 ? (
								user.roles.map(rId => (
									<Tag color="cyan" key={rId}>
										{roleMap.get(rId) || `Role #${rId}`}
									</Tag>
								))
							) : (
								<Tag color="default">No Role</Tag>
							)}
						</div>
					</Descriptions.Item>
					<Descriptions.Item label="Created At">{user.createdAt ? new Date(user.createdAt).toLocaleString() : "-"}</Descriptions.Item>
					<Descriptions.Item label="Updated At">{user.updatedAt ? new Date(user.updatedAt).toLocaleString() : "-"}</Descriptions.Item>
				</Descriptions>
			</Card>
		</div>
	);
}
