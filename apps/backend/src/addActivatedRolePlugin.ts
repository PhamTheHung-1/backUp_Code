import type { Elysia } from "elysia";
import { roleRepository } from "./modules/role/role.repository";

// plugin: Add activated roles to context
export const addActivatedRolePlugin = async (app: Elysia) => {
	const activatedRoles = await roleRepository.findActivatedRoleApis();

	const roleMap: Record<string, Array<number>> = {};

	activatedRoles.forEach(role => {
		role.apis?.forEach(api => {
			if (roleMap[api] === undefined) roleMap[api] = [];
			if (roleMap[api].indexOf(role.id) < 0) roleMap[api].push(role.id);
		});
	});

	return app.decorate("activatedRoles", roleMap);
};
