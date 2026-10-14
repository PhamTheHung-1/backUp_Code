import type { ChangePassword, CreateUser, SafeUser, UpdateUser } from "@be/modules/user/user.schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { treatyClient, unwrap } from "./apiClient";

export interface SignInReq {
	username: string;
	password: string;
}

export type UserItem = SafeUser;
export type UserList = SafeUser[];
export type CreateUserType = CreateUser;
export type UpdateUserType = UpdateUser;
export type ChangePasswordType = ChangePassword;

export const useLogin = () => {
	return useMutation({
		mutationFn: async (loginData: SignInReq) => unwrap(treatyClient.api.auth.post(loginData)),
	});
};

export const useChangePasswordMutation = () => {
	return useMutation({
		mutationFn: async (data: ChangePassword) => {
			return unwrap(treatyClient.api.user["change-password"].post(data));
		},
	});
};

export const useUsersQuery = () => {
	return useQuery<UserList, unknown>({
		queryKey: ["users"],
		queryFn: async () => {
			return unwrap(treatyClient.api.user.get());
		},
	});
};

export const useUserDetailQuery = (id?: number) => {
	return useQuery<UserItem | null, unknown>({
		queryKey: ["user", id],
		enabled: id !== undefined && !Number.isNaN(id),
		queryFn: async () => {
			if (!id) return null;
			return unwrap(treatyClient.api.user({ id }).get());
		},
	});
};

export const useUserMutation = () => {
	return useMutation({
		mutationFn: async (user: CreateUserType | UpdateUserType) => {
			if ("id" in user && user.id) {
				// update
				return unwrap(treatyClient.api.user.put(user));
			}
			// create
			return unwrap(treatyClient.api.user.post(user as CreateUserType));
		},
	});
};

export const useDeleteUserMutation = () => {
	return useMutation({
		mutationFn: async (id: number) => {
			return unwrap(treatyClient.api.user({ id }).delete());
		},
	});
};
