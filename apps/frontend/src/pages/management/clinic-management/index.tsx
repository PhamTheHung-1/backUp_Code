import { ApiClientError } from "@fe/async-store/apiClient";
import { type AvailableClinic, useClinicContextQuery, useSelectClinic } from "@fe/async-store/clinic-context";
import { useActiveClinicId } from "@fe/store/clinicStore";
import { useUserInfo } from "@fe/store/userStore";
import { Alert, Button, Card, Descriptions, Empty, Result, Skeleton, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";

function getErrorMessage(error: unknown) {
	if (error instanceof ApiClientError && error.status === 403) {
		return "Your clinic access was denied. Choose a clinic where you have an active membership or ask an administrator to check your membership.";
	}
	return error instanceof Error ? error.message : "Could not load clinic access.";
}

export default function ClinicManagementPage() {
	const query = useClinicContextQuery();
	const selectClinic = useSelectClinic();
	const activeClinicId = useActiveClinicId();
	const userInfo = useUserInfo();
	const clinicUserId = userInfo.id === undefined ? null : String(userInfo.id);
	const clinics = query.data?.availableClinics ?? [];
	const activeClinic = query.data?.activeClinic ?? null;

	const columns: ColumnsType<AvailableClinic> = [
		{ title: "Clinic", dataIndex: "name", key: "name" },
		{ title: "Clinic ID", dataIndex: "id", key: "id", width: 140 },
		{
			title: "Access",
			key: "membership",
			width: 150,
			render: (_, clinic) => (
				<Tag color={clinic.id === activeClinic?.id ? "processing" : "success"}>{clinic.id === activeClinic?.id ? "Active" : "Available"}</Tag>
			),
		},
		{
			title: "Action",
			key: "action",
			width: 160,
			render: (_, clinic) =>
				clinic.id === activeClinic?.id ? (
					<Button disabled>Current clinic</Button>
				) : (
					<Button
						type="primary"
						onClick={() => {
							if (clinicUserId) selectClinic(clinic.id);
						}}
					>
						Switch clinic
					</Button>
				),
		},
	];

	if (query.isPending) {
		return (
			<Space direction="vertical" size="large" className="w-full">
				<Typography.Title level={2}>Clinics</Typography.Title>
				<Skeleton active />
				<Skeleton active />
			</Space>
		);
	}

	if (query.isError) {
		return (
			<Result
				status={query.error instanceof ApiClientError && query.error.status === 403 ? "403" : "error"}
				title="Clinic access unavailable"
				subTitle={getErrorMessage(query.error)}
				extra={<Button onClick={() => void query.refetch()}>Retry</Button>}
			/>
		);
	}

	if (clinics.length === 0) {
		return (
			<Card>
				<Empty description="No active clinic memberships were returned by the server." />
			</Card>
		);
	}

	return (
		<Space direction="vertical" size="large" className="w-full">
			<div>
				<Typography.Title level={2}>Clinics</Typography.Title>
				<Typography.Paragraph type="secondary">
					These clinics are returned by the backend for your active memberships. Selecting a clinic changes the context used by subsequent API
					requests.
				</Typography.Paragraph>
			</div>

			<Card title="Available clinics">
				<Table<AvailableClinic>
					rowKey="id"
					columns={columns}
					dataSource={clinics}
					pagination={{ pageSize: 8, showSizeChanger: true }}
					locale={{ emptyText: <Empty description="No clinics available" /> }}
				/>
			</Card>

			<Card title="Current clinic">
				{activeClinic ? (
					<Descriptions bordered column={{ xs: 1, sm: 2 }}>
						<Descriptions.Item label="Name">{activeClinic.name}</Descriptions.Item>
						<Descriptions.Item label="Clinic ID">{activeClinic.id}</Descriptions.Item>
						<Descriptions.Item label="Membership access">Active (verified by backend)</Descriptions.Item>
					</Descriptions>
				) : (
					<Alert
						type="info"
						showIcon
						message="No active clinic selected"
						description="Select an available clinic above. The backend will verify membership before accepting it."
					/>
				)}
				{activeClinicId !== null && activeClinic && activeClinicId !== activeClinic.id ? (
					<Alert className="mt-4" type="info" message="Refreshing the selected clinic context…" />
				) : null}
			</Card>

			<Alert
				type="warning"
				showIcon
				message="Branch and membership administration is not available from the current backend API."
				description="The backend currently exposes clinic context selection only. It does not expose clinic detail, branch list/create/update, membership list/status changes, or membership role/branch assignment endpoints. This page does not use mock data for those operations."
			/>
		</Space>
	);
}
