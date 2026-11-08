import { AppError } from "@be/shared/errors/app-error";
import type { App } from "../../App";

export default (app: App) =>
	app.get(
		"",
		({ clinicAuth }) => {
			if (!clinicAuth) throw AppError.unauthorized("Unauthenticated");
			const activeClinicId = clinicAuth.clinicContext?.clinicId;
			return {
				activeClinic: activeClinicId === undefined ? null : (clinicAuth.availableClinics.find(clinic => clinic.id === activeClinicId) ?? null),
				availableClinics: clinicAuth.availableClinics,
			};
		},
		{
			isAuth: true,
			detail: {
				summary: "Return available clinic contexts",
				tags: ["Clinic"],
				authType: 1,
			},
		},
	);
