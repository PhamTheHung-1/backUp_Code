import { Iconify, SvgIcon } from "@fe/components/icon";
import { CircleLoading } from "@fe/components/loading";
import { useUserPermission } from "@fe/store/userStore";
import { flattenTrees } from "@fe/utils/tree";
import { Tag } from "antd";
import { isEmpty } from "ramda";
import { lazy, Suspense, useMemo, type ComponentType } from "react";
import { Navigate, Outlet } from "react-router";
import type { Permission } from "#fe/entity";
import { BasicStatus, MenuType } from "#fe/enum";
import type { AppRouteObject } from "#fe/router";
import { getRoutesFromModules } from "../utils";

const ENTRY_PATH = "/src/pages";
type PageComponent = ComponentType<Record<string, unknown>>;
type PageModule = { default: PageComponent };
const PAGES = import.meta.glob<PageModule>("/src/pages/**/*.tsx");
const loadComponentFromPath = (path: string) => PAGES[`${ENTRY_PATH}${path}`];
const ClinicManagementPage = lazy(() => import("@fe/pages/management/clinic-management"));
const OwnersPage = lazy(() => import("@fe/pages/management/owners"));
const PetsPage = lazy(() => import("@fe/pages/management/pets"));
const AppointmentsPage = lazy(() => import("@fe/pages/management/appointments"));
const StaffPage = lazy(() => import("@fe/pages/management/staff"));

const CLINIC_MANAGEMENT_ROUTE: AppRouteObject = {
	path: "/clinic-management",
	element: (
		<Suspense fallback={<CircleLoading />}>
			<ClinicManagementPage />
		</Suspense>
	),
	meta: {
		label: "Clinic management",
		icon: <SvgIcon icon="ic-management" className="ant-menu-item-icon" size="24" />,
		key: "/clinic-management",
	},
	order: 0,
};

const OWNER_MANAGEMENT_ROUTE: AppRouteObject = {
	path: "/owners",
	element: (
		<Suspense fallback={<CircleLoading />}>
			<OwnersPage />
		</Suspense>
	),
	meta: {
		label: "Owners",
		icon: <Iconify icon="solar:users-group-rounded-bold-duotone" className="ant-menu-item-icon" size={24} />,
		key: "/owners",
	},
	order: 1,
};

const PET_MANAGEMENT_ROUTE: AppRouteObject = {
	path: "/pets",
	element: (
		<Suspense fallback={<CircleLoading />}>
			<PetsPage />
		</Suspense>
	),
	meta: {
		label: "Pets",
		icon: <Iconify icon="solar:paw-print-bold-duotone" className="ant-menu-item-icon" size={24} />,
		key: "/pets",
	},
	order: 2,
};

const APPOINTMENT_MANAGEMENT_ROUTE: AppRouteObject = {
	path: "/appointments",
	element: (
		<Suspense fallback={<CircleLoading />}>
			<AppointmentsPage />
		</Suspense>
	),
	meta: {
		label: "Appointments",
		icon: <Iconify icon="solar:calendar-mark-bold-duotone" className="ant-menu-item-icon" size={24} />,
		key: "/appointments",
	},
	order: 3,
};

const STAFF_MANAGEMENT_ROUTE: AppRouteObject = {
	path: "/staff",
	element: (
		<Suspense fallback={<CircleLoading />}>
			<StaffPage />
		</Suspense>
	),
	meta: {
		label: "Staff",
		icon: <Iconify icon="solar:user-id-bold-duotone" className="ant-menu-item-icon" size={24} />,
		key: "/staff",
	},
	order: 4,
};

/**
 * Build complete route path by traversing from current permission to root
 * @param {Permission} permission - current permission
 * @param {Permission[]} flattenedPermissions - flattened permission array
 * @param {string[]} segments - route segments accumulator
 * @returns {string} normalized complete route path
 */
function buildCompleteRoute(permission: Permission, flattenedPermissions: Permission[], segments: string[] = []): string {
	// Add current route segment
	segments.unshift(permission.route);

	// Base case: reached root permission
	if (!permission.parentId) {
		return `/${segments.join("/")}`;
	}

	// Find parent and continue recursion
	const parent = flattenedPermissions.find(p => p.id === permission.parentId);
	if (!parent) {
		console.warn(`Parent permission not found for ID: ${permission.parentId}`);
		return `/${segments.join("/")}`;
	}

	return buildCompleteRoute(parent, flattenedPermissions, segments);
}

// Components
function NewFeatureTag() {
	return (
		<Tag color="cyan" className="!ml-2">
			<div className="flex items-center gap-1">
				<Iconify icon="solar:bell-bing-bold-duotone" size={12} />
				<span className="ms-1">NEW</span>
			</div>
		</Tag>
	);
}

// Route Transformers
const createBaseRoute = (permission: Permission, completeRoute: string): AppRouteObject => {
	const { route, label, icon, order, hide, hideTab, status, frameSrc, newFeature } = permission;

	const baseRoute: AppRouteObject = {
		path: route,
		meta: {
			label,
			key: completeRoute,
			hideMenu: !!hide,
			hideTab,
			disabled: status === BasicStatus.DISABLE,
		},
	};

	if (order) baseRoute.order = order;
	if (baseRoute.meta) {
		if (icon) baseRoute.meta.icon = icon;
		if (frameSrc) baseRoute.meta.frameSrc = frameSrc;
		if (newFeature) baseRoute.meta.suffix = <NewFeatureTag />;
	}

	return baseRoute;
};

const createCatalogueRoute = (permission: Permission, flattenedPermissions: Permission[]): AppRouteObject => {
	const baseRoute = createBaseRoute(permission, buildCompleteRoute(permission, flattenedPermissions));

	if (baseRoute.meta) {
		baseRoute.meta.hideTab = true;
	}

	const { parentId, children = [] } = permission;
	if (!parentId) {
		baseRoute.element = (
			<Suspense fallback={<CircleLoading />}>
				<Outlet />
			</Suspense>
		);
	}

	baseRoute.children = transformPermissionsToRoutes(children, flattenedPermissions);

	if (!isEmpty(children)) {
		baseRoute.children.unshift({
			index: true,
			element: <Navigate to={children[0].route} replace />,
		});
	}

	return baseRoute;
};

const createMenuRoute = (permission: Permission, flattenedPermissions: Permission[]): AppRouteObject => {
	const baseRoute = createBaseRoute(permission, buildCompleteRoute(permission, flattenedPermissions));

	if (permission.component) {
		const loader = loadComponentFromPath(permission.component);

		if (loader) {
			const Element = lazy(loader);

			if (permission.frameSrc) {
				baseRoute.element = <Element src={permission.frameSrc} />;
			} else {
				baseRoute.element = (
					<Suspense fallback={<CircleLoading />}>
						<Element />
					</Suspense>
				);
			}
		}
	}

	return baseRoute;
};

function transformPermissionsToRoutes(permissions: Permission[], flattenedPermissions: Permission[]): AppRouteObject[] {
	return permissions.map(permission => {
		if (permission.type === MenuType.CATALOGUE) {
			return createCatalogueRoute(permission, flattenedPermissions);
		}
		return createMenuRoute(permission, flattenedPermissions);
	});
}

const ROUTE_MODE = import.meta.env.VITE_APP_ROUTER_MODE;
export function usePermissionRoutes() {
    const permissions = useUserPermission();

    const permissionRoutes = useMemo(() => {
        if (ROUTE_MODE === "module") {
            return [
                ...getRoutesFromModules(),
                CLINIC_MANAGEMENT_ROUTE,
                OWNER_MANAGEMENT_ROUTE,
                PET_MANAGEMENT_ROUTE,
                APPOINTMENT_MANAGEMENT_ROUTE,
                STAFF_MANAGEMENT_ROUTE,
            ];
        }

        if (!permissions) {
            return [
                CLINIC_MANAGEMENT_ROUTE,
                OWNER_MANAGEMENT_ROUTE,
                PET_MANAGEMENT_ROUTE,
                APPOINTMENT_MANAGEMENT_ROUTE,
                STAFF_MANAGEMENT_ROUTE,
            ];
        }

        const flattenedPermissions = flattenTrees(permissions);

        return [
            ...transformPermissionsToRoutes(permissions, flattenedPermissions),
            CLINIC_MANAGEMENT_ROUTE,
            OWNER_MANAGEMENT_ROUTE,
            PET_MANAGEMENT_ROUTE,
            APPOINTMENT_MANAGEMENT_ROUTE,
            STAFF_MANAGEMENT_ROUTE,
        ];
    }, [permissions]);

    return permissionRoutes;
}
