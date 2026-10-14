import { SvgIcon } from "@fe/components/icon";
import { CircleLoading } from "@fe/components/loading";
import { lazy, Suspense } from "react";
import { Navigate, Outlet } from "react-router";
import type { AppRouteObject } from "#fe/router";

const HomePage = lazy(() => import("@fe/pages/dashboard/workbench"));
const Analysis = lazy(() => import("@fe/pages/dashboard/analysis"));

const dashboard: AppRouteObject = {
	order: 1,
	path: "dashboard",
	element: (
		<Suspense fallback={<CircleLoading />}>
			<Outlet />
		</Suspense>
	),
	meta: {
		label: "sys.menu.dashboard",
		icon: <SvgIcon icon="ic-analysis" className="ant-menu-item-icon" size="24" />,
		key: "/dashboard",
	},
	children: [
		{
			index: true,
			element: <Navigate to="workbench" replace />,
		},
		{
			path: "workbench",
			element: <HomePage />,
			meta: { label: "sys.menu.workbench", key: "/dashboard/workbench" },
		},
		{
			path: "analysis",
			element: <Analysis />,
			meta: { label: "sys.menu.analysis", key: "/dashboard/analysis" },
		},
	],
};

export default dashboard;
