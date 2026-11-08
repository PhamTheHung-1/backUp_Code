import { ApiClientError } from "@fe/async-store/apiClient";
import { useClinicContextQuery, useSelectClinic } from "@fe/async-store/clinic-context";
import { useActiveClinicId } from "@fe/store/clinicStore";
import { useUserInfo } from "@fe/store/userStore";
import { Alert, Select, Spin, Tooltip } from "antd";
import { Link } from "react-router";

function getErrorMessage(error: unknown) {
	if (error instanceof ApiClientError && error.status === 403) {
		return "You do not have access to this clinic. Select an available clinic or contact an administrator.";
	}
	return error instanceof Error ? error.message : "Could not load your clinics.";
}

export default function ClinicSwitcher() {
	const query = useClinicContextQuery();
	const selectClinic = useSelectClinic();
	const activeClinicId = useActiveClinicId();
	const userInfo = useUserInfo();
	const clinicUserId = userInfo.id === undefined ? null : String(userInfo.id);
	const selectedClinicId =
		query.data?.activeClinic?.id ?? (query.data?.availableClinics.some(clinic => clinic.id === activeClinicId) ? activeClinicId : undefined);

	if (query.isPending) return <Spin size="small" className="mx-4" />;

	if (query.isError) {
		return (
			<Tooltip title={getErrorMessage(query.error)}>
				<Alert type="error" showIcon message="Clinic access unavailable" className="mx-2 max-w-64" />
			</Tooltip>
		);
	}

	const clinics = query.data?.availableClinics ?? [];
	if (clinics.length === 0) {
		return <Alert type="warning" showIcon message="No active clinic membership" className="mx-2" />;
	}

	return (
		<div className="flex items-center gap-2 px-2">
			<Select
				aria-label="Active clinic"
				placeholder="Select clinic"
				value={selectedClinicId}
				className="w-52"
				options={clinics.map(clinic => ({ value: clinic.id, label: clinic.name }))}
				onChange={clinicId => {
					if (clinicUserId && clinics.some(clinic => clinic.id === clinicId)) selectClinic(clinicId);
				}}
			/>
			<Link to="/clinic-management" className="whitespace-nowrap text-primary">
				Manage clinics
			</Link>
		</div>
	);
}
