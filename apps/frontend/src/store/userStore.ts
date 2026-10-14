import { type SignInReq, useLogin } from "@fe/async-store/user";
import { convertFlatArrayToTree } from "@fe/utils/tree";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { UserInfo, UserToken } from "#fe/entity";
import { StorageEnum } from "#fe/enum";

const { VITE_APP_HOMEPAGE: HOMEPAGE } = import.meta.env;

type UserStore = {
	userInfo: Partial<UserInfo>;
	userToken: UserToken;
	// Use actions Namespace to store all action
	actions: {
		setUserInfo: (userInfo: Partial<UserInfo>) => void;
		setUserToken: (token: UserToken) => void;
		clearUserInfoAndToken: () => void;
	};
};

const useUserStore = create<UserStore>()(
	persist(
		set => ({
			userInfo: {},
			userToken: {},
			actions: {
				setUserInfo: userInfo => {
					set({ userInfo });
				},
				setUserToken: userToken => {
					set({ userToken });
				},
				clearUserInfoAndToken() {
					set({ userInfo: {}, userToken: {} });
				},
			},
		}),
		{
			name: "userStore", // name of the item in the storage (must be unique)
			storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
			partialize: state => ({
				[StorageEnum.UserInfo]: state.userInfo,
				[StorageEnum.UserToken]: state.userToken,
			}),
		},
	),
);

export const useUserInfo = () => useUserStore(state => state.userInfo);
export const useUserToken = () => useUserStore(state => state.userToken);
export const useUserPermission = () => useUserStore(state => state.userInfo.permissions);
export const useUserActions = () => useUserStore(state => state.actions);

export const useSignIn = () => {
	const loginMutation = useLogin();
	const navigate = useNavigate();
	const { setUserToken, setUserInfo } = useUserActions();

	const signIn = async (loginData: SignInReq) => {
		try {
			const { user, token } = await loginMutation.mutateAsync(loginData);
			const menus = convertFlatArrayToTree(user.menus);
			const rawUser = user as any;
			const username = rawUser.username || (rawUser.email ? rawUser.email.split("@")[0] : rawUser.username || "");
			const formatedUser: Partial<UserInfo> = {
				id: rawUser.id ?? rawUser.username ?? "",
				email: rawUser.email ?? rawUser.username ?? "",
				username,
				avatar: rawUser.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${username || "user"}`,
				roles: rawUser.roles ?? [],
				status: rawUser.status ?? true,
				permissions: menus,
			};
			setUserToken({ accessToken: token ? token : undefined, refreshToken: token ? token : undefined });
			setUserInfo(formatedUser);
			navigate(HOMEPAGE, { replace: true });
		} catch (err: any) {
			console.log(err);
			toast.error(err.message || err, {
				position: "top-center",
			});
		}
	};

	return signIn;
};

export default useUserStore;
