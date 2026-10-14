import type { Routes } from "@be/routes-types";
import { treaty } from "@elysiajs/eden";
import useStore from "@fe/store/userStore";
import type { DeepPrettify } from "packages/type-utils";

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
		// onRequst agrs:path, options
		const userToken = useStore.getState().userToken;
		if (userToken.accessToken) {
			return {
				headers: {
					authorization: `Bearer ${userToken.accessToken}`,
				},
			};
		}
	},
});

export async function unwrap<T>(promise: Promise<{ data: T; error: any; status: number }>): Promise<DeepPrettify<NonNullable<T>>> {
	const { data, error } = await promise;
	if (error) {
		const errorMsg = error.value?.message || error.value || error.message || "Request failed";
		throw new Error(typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg));
	}
	if (data === null || data === undefined) {
		throw new Error("Empty Data");
	}
	return data as DeepPrettify<NonNullable<T>>;
}

// export type treatyClientType = typeof treatyClient;
export type App = Routes;
