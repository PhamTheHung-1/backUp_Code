import DashboardLayout from "@fe/layouts/dashboard";
import PageError from "@fe/pages/sys/error/PageError";
import Login from "@fe/pages/sys/login/Login";
import ProtectedRoute from "@fe/router/components/protected-route";
import { usePermissionRoutes } from "@fe/router/hooks";
import { ERROR_ROUTE } from "@fe/router/routes/error-routes";
import { ErrorBoundary } from "react-error-boundary";
import { createHashRouter, Navigate, type RouteObject } from "react-router";
import { RouterProvider } from "react-router/dom";
import type { AppRouteObject } from "#fe/router";

const { VITE_APP_HOMEPAGE: HOMEPAGE } = import.meta.env;

const PUBLIC_ROUTE: AppRouteObject = {
	path: "/login",
	element: (
		<ErrorBoundary FallbackComponent={PageError}>
			<Login />
		</ErrorBoundary>
	),
};

const NO_MATCHED_ROUTE: AppRouteObject = {
	path: "*",
	element: <Navigate to="/404" replace />,
};

export default function Router() {
	const permissionRoutes = usePermissionRoutes();

	const PROTECTED_ROUTE: AppRouteObject = {
		path: "/",
		element: (
			<ProtectedRoute>
				<DashboardLayout />
			</ProtectedRoute>
		),
		children: [{ index: true, element: <Navigate to={HOMEPAGE} replace /> }, ...permissionRoutes],
	};

	const routes = [PUBLIC_ROUTE, PROTECTED_ROUTE, ERROR_ROUTE, NO_MATCHED_ROUTE] as RouteObject[];

	const router = createHashRouter(routes);

	return <RouterProvider router={router} />;
}
