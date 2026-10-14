import { convertFlatArrayToTree } from "@fe/utils/tree";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { InferElementType, InferReqBodyType, InferResType, TreeFromFlatArray } from "packages/type-utils";
import { treatyClient, unwrap } from "./apiClient";
import { menuQueryKeys } from "./query-keys";

// type req = InferReqBodyType<typeof treatyClient.api.menu.put>;
// type response = InferResponeType<typeof treatyClient.api.menus.get>;
// type requestBody = InferRequestBody<App, '/api/menu', 'put'>;
// type response = Treaty.Data<typeof treatyClient.api.menus.get>;

// type UserData = InferTreatyData<treatyClientType['api']['menus']['get']>;
// type menuT = TreeFromFlatArray<UserData>;

export type MenuTree = TreeFromFlatArray<InferResType<typeof treatyClient.api.menu.list.get>> | undefined;
export type Menu = InferElementType<InferResType<typeof treatyClient.api.menu.list.get>>;

// type Res = Treaty.Data<typeof treatyClient.api.menus.get>;
// export type Menu = ExtractArrayElementType<MenuList>;

export const useMenusQuery = () => {
	return useQuery<MenuTree, unknown>({
		queryKey: menuQueryKeys.list,
		queryFn: async () => {
			const menus = await unwrap(treatyClient.api.menu.list.get());
			return convertFlatArrayToTree(menus);
		},
		staleTime: Number.POSITIVE_INFINITY,
	});
};

export type CreateMenuType = InferReqBodyType<typeof treatyClient.api.menu.post>;

export const useCreateMenu = () => {
	return useMutation({
		mutationFn: (menu: CreateMenuType) => {
			if (menu.id) {
				return unwrap(treatyClient.api.menu.put(menu as InferReqBodyType<typeof treatyClient.api.menu.put>));
			}

			menu.id = undefined;
			return unwrap(treatyClient.api.menu.post(menu));
		},
	});
};

export const useDeleteMenu = () => {
	return useMutation({
		mutationFn: (id: number) => treatyClient.api.menu({ id }).delete(),
	});
};
