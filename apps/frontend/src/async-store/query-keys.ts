export const menuQueryKeys = {
	all: ["menus"],
	detail: (menuId: string) => [...menuQueryKeys.all, "detail", menuId],
	list: ["menus", "list"],
};
