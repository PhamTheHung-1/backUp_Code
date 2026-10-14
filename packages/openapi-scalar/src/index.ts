import type Elysia from "elysia";
import { generateOpenAPISpec } from "./openapi";
import { ScalarRender } from "./scalar-render";
export { toOpenAPISchema, generateOpenAPISpec } from "./openapi";

// biome-ignore lint/suspicious/noExplicitAny: temp
export const OpenAPIScalarPlugin = (config: any) => async (app: Elysia) => {
	// console.log(config);
	return app
		.get("/openapi", () => {
			const info = config.info || {
				title: "Elysia Documentation",
				description: "Development documentation",
				version: "0.0.0",
			};
			const relativePath = "openapi/json";
			const scalar = {
				version: "4.5.0",
			};

			return new Response(
				ScalarRender(
					info,
					{
						url: relativePath,
						version: "latest",
						cdn: `https://cdn.jsdelivr.net/npm/@scalar/api-reference@${scalar?.version ?? "latest"}/dist/browser/standalone.min.js`,
						// ...(scalar as ApiReferenceConfiguration),
						_integration: "elysiajs",
					},
					JSON.stringify(generateOpenAPISpec(app, config)),
				),
				{
					headers: {
						"content-type": "text/html; charset=utf8",
					},
				},
			);
		})
		.get("/openapi/json", () => {
			return generateOpenAPISpec(app, config);
		});
};
