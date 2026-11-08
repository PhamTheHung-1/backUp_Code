import { cors } from "@elysiajs/cors";
import jwt from "@elysiajs/jwt";
import Elysia, { status, t } from "elysia";
import { autoload } from "elysia-autoload";
import { openapiConfig, type TagType, xtagGroups, xtags } from "./openapi-config";
//to load env type
import "./env";

import { AppError } from "@be/shared/errors/app-error";
import { OpenAPIScalarPlugin } from "openapi-scalar";
import { clinicContextService } from "./modules/clinic-context/clinic-context.service";

declare module "elysia" {
	interface DocumentDecoration {
		tags?: TagType[];
		authType?: 0 | 1 | 2;
	}
}

//to solve type break problem: https://github.com/elysiajs/elysia-jwt/issues/26. To do: must recheck???
const JWTPlugin = async (app: Elysia) => {
	return app.use(
		jwt({
			name: "jwt",
			secret: process.env.JWT_SECRET,
			schema: t.Object({
				username: t.Union([t.String(), t.Null()]),
				roles: t.Union([t.Array(t.Number()), t.Null()]),
			}),
		}),
	);
};

export const app = new Elysia({
	aot: true, //turn on precompile
})
	.use(await JWTPlugin)
	.macro({
		isAuth: (enabled: boolean) => ({
			resolve: async ({ headers, jwt, request }) => {
				if (!enabled) return { clinicAuth: null };

				const isClinicSelector = new URL(request.url).pathname.replace(/\/$/, "").endsWith("/api/clinic-context");
				const clinicAuth = await clinicContextService.authenticateRequest(headers.authorization, jwt, headers["x-clinic-id"], isClinicSelector);

				if (!isClinicSelector) clinicContextService.requireClinicContext(clinicAuth);

				if (headers.$hPath !== undefined) {
					const context = clinicContextService.requireClinicContext(clinicAuth);
					clinicContextService.requirePermission(context, String(headers.$hPath));
				}

				return { clinicAuth };
			},
		}),
	})
	.onError(({ error }) => {
		if (error instanceof AppError) {
			return status(error.statusCode, error.message);
		}
	})
	.use(cors())
	.use(
		await autoload({
			dir: "./modules",
			prefix: "/api",
			pattern: "**/*.routes.ts",
			types: process.env.nonExportedType ? undefined : { useExport: true }, //off to build
			// Ignore test files and spec files
			ignore: ["**/*.test.ts", "**/*.spec.ts", "**/*.schema.ts", "**/*.service.ts", "**/*.repository.ts"],
		}),
	)
	.get(
		"/__apis__",
		() => {
			//note: don't change url. TODO: integrate with Eden treaty
			const nodeMap = new Map();
			xtags.forEach(t => {
				nodeMap.set(t, {
					id: t,
					name: t,
					children: [],
				});
			});

			app.routes
				.filter(r => r.hooks?.detail?.authType === 2) //chỉ route phải authorization
				.forEach(r => {
					const tagName = r.hooks?.detail?.tags?.[0] || "Other";
					const node = nodeMap.get(tagName);
					if (node) {
						node.children.push({
							id: Bun.hash.xxHash32(`${r.method}-${r.path}`),
							path: r.path,
							method: r.method,
							name: r.hooks.detail?.summary,
							children: [],
						});
					} else {
						throw new Error(`Tag: ${tagName} is not found!`);
					}
				});

			// biome-ignore lint/suspicious/noExplicitAny : temp
			const rootNodes: any[] = [];

			for (const g of xtagGroups) {
				if (!g.tags || (g.tags.length as number) === 0) {
					rootNodes.push(nodeMap.get(g.name));
				} else {
					rootNodes.push({
						id: g.name,
						name: g.name,
						children: g.tags?.map(tag => nodeMap.get(tag)),
					});
				}
			}
			return rootNodes.filter(n => n.children.length > 0);
		},
		{
			detail: {
				tags: ["Other"],
				authType: 0,
			},
		},
	)
	.use(OpenAPIScalarPlugin(openapiConfig));

export type App = typeof app;
