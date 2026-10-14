import { type MenuRepository, menuRepository } from "./menu.repository";
import type { InsertMenu } from "./menu.schema";

export function createMenuService(menuRepo: MenuRepository = menuRepository) {
	return {
		async listMenus() {
			return menuRepo.findAll();
		},

		async createMenu(data: InsertMenu) {
			return menuRepo.create(data);
		},

		// biome-ignore lint/suspicious/noExplicitAny: dynamic update object
		async updateMenu(data: { id: number; [key: string]: any }) {
			const { id, ...updateData } = data;
			return menuRepo.update(id, updateData);
		},

		async deleteMenu(id: number) {
			const result = await menuRepo.delete(id);
			return { status: 0, data: result };
		},
	};
}

export const menuService = createMenuService();
export type MenuService = ReturnType<typeof createMenuService>;
