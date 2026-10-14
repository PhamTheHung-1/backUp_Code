import { isEmpty } from "ramda";
import { useEffect, useState } from "react";
import { type Params, useMatches, useOutlet } from "react-router";
import type { RouteMeta } from "#fe/router";
import { useFlattenedRoutes } from "./use-flattened-routes";
import { useRouter } from "./use-router";

const { VITE_APP_HOMEPAGE: HOMEPAGE } = import.meta.env;
/**
 * Returns the current route Meta information
 */
export function useCurrentRouteMeta() {
	// const pathname = usePathname();
	const { push } = useRouter();

	// Get the routing component instance
	const children = useOutlet();

	// Get all matching routes
	const matchs = useMatches();

	// Get the flattened routing menu
	const flattenedRoutes = useFlattenedRoutes();

	const [currentRouteMeta, setCurrentRouteMeta] = useState<RouteMeta>();

	useEffect(() => {
		// Get the currently matching route
		const lastRoute = matchs.at(-1);
		if (!lastRoute) return;

		const { pathname, params } = lastRoute;
		const matchedRouteMeta = flattenedRoutes.find(item => {
			const replacedKey = replaceDynamicParams(item.key, params);
			return replacedKey === pathname || `${replacedKey}/` === pathname;
		});

		if (matchedRouteMeta) {
			matchedRouteMeta.outlet = children;
			if (!isEmpty(params)) {
				matchedRouteMeta.params = params;
			}
			setCurrentRouteMeta({ ...matchedRouteMeta });
		} else {
			push(HOMEPAGE);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [matchs]);

	return currentRouteMeta;
}

/**
 * replace `user/:id`  to `/user/1234512345`
 */
export const replaceDynamicParams = (menuKey: string, params: Params<string>) => {
	let replacedPathName = menuKey;

	// Parsing parameter names in routing paths
	const paramNames = menuKey.match(/:\w+/g);

	if (paramNames) {
		for (const paramName of paramNames) {
			// Remove the colon to get the parameter name
			const paramKey = paramName.slice(1);
			if (!params[paramKey]) continue;

			replacedPathName = replacedPathName.replace(paramName, params[paramKey]);
		}
	}

	return replacedPathName;
};
