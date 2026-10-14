import { createHmac, randomBytes } from "node:crypto";
import { db } from "./db";
import { menus } from "./db/schema/menu-schema";
import { roles } from "./db/schema/role-schema";
import { usersTableSchema as users } from "./db/schema/user-schema";

async function createMenus() {
	//init menus
	const r = await db
		.insert(menus)
		.values({
			label: "sys.menu.dashboard",
			name: "Dashboard",
			icon: "ic-analysis",
			type: 0, //catalogue
			route: "dashboard",
			order: 1,
		})
		.returning({ id: menus.id });

	await db.insert(menus).values([
		{
			parentId: r[0].id,
			label: "sys.menu.workbench",
			name: "Workbench",
			type: 1, //menu
			route: "workbench",
			component: "/dashboard/workbench/index.tsx",
		},
		{
			parentId: r[0].id,
			label: "sys.menu.analysis",
			name: "Analysis",
			type: 1,
			route: "analysis",
			component: "/dashboard/analysis/index.tsx",
		},
	]);

	const r2 = await db
		.insert(menus)
		.values({
			label: "sys.menu.management",
			name: "Management",
			icon: "ic-management",
			type: 0,
			route: "management",
			order: 2,
		})
		.returning({ id: menus.id });

	const usermenu = await db
		.insert(menus)
		.values({
			parentId: r2[0].id,
			label: "sys.menu.user.index",
			name: "User",
			type: 0,
			order: 3,
			route: "user",
		})
		.returning({ id: menus.id });

	await db.insert(menus).values([
		{
			parentId: usermenu[0].id,
			label: "sys.menu.user.profile",
			name: "Profile",
			type: 1,
			route: "profile",
			component: "/management/user/profile/index.tsx",
		},
		{
			parentId: usermenu[0].id,
			label: "sys.menu.user.account",
			name: "Account",
			type: 1,
			route: "account",
			component: "/management/user/account/index.tsx",
		},
	]);

	const systems = await db
		.insert(menus)
		.values({
			parentId: r2[0].id,
			label: "sys.menu.system.index",
			name: "System",
			type: 0,
			order: 4,
			route: "system",
		})
		.returning({ id: menus.id });

	await db.insert(menus).values([
		{
			parentId: systems[0].id,
			label: "sys.menu.system.organization",
			name: "Organization",
			type: 1,
			route: "organization",
			component: "/management/system/organization/index.tsx",
		},
		{
			parentId: systems[0].id,
			label: "sys.menu.system.menu.label",
			name: "Menu",
			type: 1,
			route: "menu",
			component: "/management/system/menu/index.tsx",
		},
		{
			parentId: systems[0].id,
			label: "sys.menu.system.role",
			name: "Role",
			type: 1,
			route: "role",
			component: "/management/system/role/index.tsx",
		},
		{
			parentId: systems[0].id,
			label: "sys.menu.system.user",
			name: "User",
			type: 1,
			route: "user",
			component: "/management/system/user/index.tsx",
		},
		{
			parentId: systems[0].id,
			label: "sys.menu.system.user_detail",
			name: "User Detail",
			type: 1,
			route: "user/:id",
			component: "/management/system/user/detail.tsx",
			hide: true,
		},
	]);

	const allmenu = await db.select({ id: menus.id }).from(menus);
	return allmenu.map(m => m.id);
}
// biome-ignore lint/suspicious/noExplicitAny : temp
async function creatRootAdminRole(menus: any) {
	//create roles
	const apis = [
		{
			method: "GET",
			url: "/api/menus",
		},
		{
			method: "POST",
			url: "/api/menu",
		},
		{
			method: "PUT",
			url: "/api/menu",
		},
		{
			method: "DELETE",
			url: "/api/menu/:id",
		},
		{
			method: "GET",
			url: "/api/role",
		},
		{
			method: "POST",
			url: "/api/role",
		},
		{
			method: "PUT",
			url: "/api/role",
		},
		{
			method: "GET",
			url: "/api/user",
		},
		{
			method: "POST",
			url: "/api/user",
		},
	].map(api => Bun.hash.xxHash32(`${api.method}-${api.url}`));

	const role = await db
		.insert(roles)
		.values({
			menus: menus,
			apis: apis,
			hmenus: [],
			name: "Root Admin",
			desc: "Root Admin role",
		})
		.returning({ id: roles.id });

	return role[0].id;
}

export default async function initDB() {
	const menus = await createMenus();
	console.log(menus);

	const roleId = await creatRootAdminRole(menus);

	//create root admin user
	const salt = randomBytes(16).toHex();
	const hpass = createHmac("sha256", salt).update("admin@123").digest("hex");
	await db.insert(users).values({
		email: "admin@gmail.com",
		username: "Root Admin",
		avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=admin",
		status: true,
		hpass,
		salt,
		roles: [roleId],
	});
}

initDB();
