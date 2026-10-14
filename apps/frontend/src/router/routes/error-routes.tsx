import { CircleLoading } from "@fe/components/loading";
import SimpleLayout from "@fe/layouts/simple";
import { lazy, Suspense } from "react";
import { Outlet } from "react-router";
import type { AppRouteObject } from "#fe/router";
import ProtectedRoute from "../components/protected-route";

const Page403 = lazy(() => import("@fe/pages/sys/error/Page403"));
const Page404 = lazy(() => import("@fe/pages/sys/error/Page404"));
const Page500 = lazy(() => import("@fe/pages/sys/error/Page500"));

/**
 * error routes
 * 403, 404, 500
 */
export const ERROR_ROUTE: AppRouteObject = {
	element: (
		<ProtectedRoute>
			<SimpleLayout>
				<Suspense fallback={<CircleLoading />}>
					<Outlet />
				</Suspense>
			</SimpleLayout>
		</ProtectedRoute>
	),
	children: [
		{ path: "403", element: <Page403 /> },
		{ path: "404", element: <Page404 /> },
		{ path: "500", element: <Page500 /> },
	],
};
