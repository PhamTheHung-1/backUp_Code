import type { Routes } from "@be/routes-types";
import { treaty } from "@elysiajs/eden";
import useClinicStore from "@fe/store/clinicStore";
import useStore from "@fe/store/userStore";
import type { DeepPrettify } from "type-utils";

// declare global {
// 	interface Promise<T> {
// 		//@ts-expect-error
// 		unWrapResponse(this: Promise<T>): Promise<DeepPrettify<Treaty.Data<T>>>;
// 	}
// }

// Promise.prototype.unWrapResponse = async function () {
// 	//resolvedValue = {data, error, headers, response, status } is return from treatyClient
// 	const { data, error } = await this;

// 	if (error) {
// 		throw error.value || error;
// 	}

// 	if (data === null) {
// 		throw new Error("Response data is null");
// 	}

// 	return data;
// };

// The inferred type of 'treatyClient' cannot be named without a reference to 'ThrowHttpError' from 'apps/admin-dashboard/node_modules/@elysiajs/eden/dist/types-0YqzVuGd'. This is likely not portable. A type annotation is necessary.
export const treatyClient = treaty<Routes>(import.meta.env.VITE_APP_BACKEND_HOST || "http://localhost:3000", {
	onRequest() {
		const userToken = useStore.getState().userToken;
		const userId = useStore.getState().userInfo.id;
		const clinicState = useClinicStore.getState();
		const headers: Record<string, string> = {};

		if (userToken.accessToken) {
			headers.authorization = `Bearer ${userToken.accessToken}`;
		}

		if (userId !== undefined && clinicState.userId === String(userId) && clinicState.activeClinicId !== null) {
			headers["X-Clinic-Id"] = String(clinicState.activeClinicId);
		}

		return { headers };
	},
});

export class ApiClientError extends Error {
	constructor(
		message: string,
		public readonly status: number,
	) {
		super(message);
		this.name = "ApiClientError";
	}
}

type SuccessfulData<Response> = Response extends { error: null; data: infer Data } ? NonNullable<Data> : never;

export async function unwrap<Response extends { data: unknown; error: unknown; status: number }>(
	promise: Promise<Response>,
): Promise<DeepPrettify<SuccessfulData<Response>>> {
	const { data, error, status } = await promise;
	if (error) {
		const errorValue = typeof error === "object" && error !== null && "value" in error ? error.value : error;
		const message = typeof errorValue === "string" ? errorValue : JSON.stringify(errorValue) || "Request failed";
		throw new ApiClientError(message, status);
	}
	if (data === null || data === undefined) {
		throw new ApiClientError("The server returned an empty response", 500);
	}
	return data as DeepPrettify<SuccessfulData<Response>>;
}

// export type treatyClientType = typeof treatyClient;
export type App = Routes;
