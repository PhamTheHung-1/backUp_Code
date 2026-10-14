import { SvgIcon } from "@fe/components/icon";
import { CircleLoading } from "@fe/components/loading";
import { lazy, Suspense } from "react";
import { Navigate, Outlet } from "react-router";
import type { AppRouteObject } from "#fe/router";

const ProfilePage = lazy(() => import("@fe/pages/management/user/profile"));
const AccountPage = lazy(() => import("@fe/pages/management/user/account"));

const OrganizationPage = lazy(() => import("@fe/pages/management/system/organization"));
const MenuPage = lazy(() => import("@fe/pages/management/system/menu"));

const Blog = lazy(() => import("@fe/pages/management/blog"));

const management: AppRouteObject = {
	order: 2,
	path: "management",
	element: (
		<Suspense fallback={<CircleLoading />}>
			<Outlet />
		</Suspense>
	),
	meta: {
		label: "sys.menu.management",
		icon: <SvgIcon icon="ic-management" className="ant-menu-item-icon" size="24" />,
		key: "/management",
	},
	children: [
		{
			index: true,
			element: <Navigate to="user" replace />,
		},
		{
			path: "user",
			meta: { label: "sys.menu.user.index", key: "/management/user" },
			children: [
				{
					index: true,
					element: <Navigate to="profile" replace />,
				},
				{
					path: "profile",
					element: <ProfilePage />,
					meta: {
						label: "sys.menu.user.profile",
						key: "/management/user/profile",
					},
				},
				{
					path: "account",
					element: <AccountPage />,
					meta: {
						label: "sys.menu.user.account",
						key: "/management/user/account",
					},
				},
			],
		},
		{
			path: "system",
			meta: { label: "sys.menu.system.index", key: "/management/system" },
			children: [
				{
					path: "organization",
					element: <OrganizationPage />,
					meta: {
						label: "sys.menu.system.organization",
						key: "/management/system/organization",
					},
				},
				{
					path: "menu",
					element: <MenuPage />,
					meta: {
						label: "sys.menu.system.menu.label",
						key: "/management/system/menu",
					},
				},
			],
		},
		{
			path: "blog",
			element: <Blog />,
			meta: { label: "sys.menu.blog", key: "/management/blog" },
		},
	],
};

export default management;
