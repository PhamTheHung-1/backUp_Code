import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import {
	addRelativeIfNotDot,
	fixSlashes,
	globSync,
	matchesPattern,
	sortByNestedParams,
	transformToUrl,
} from "../packages/elysia-autoload/src/utils.ts";

export interface GenerateRoutesTypesOptions {
	/**
	 * Directory containing route files
	 * @default "<repoRoot>/apps/backend/src/routes"
	 */
	routesDir?: string;
	/**
	 * Output path for the generated routes-types.ts
	 * @default "<repoRoot>/apps/backend/src/routes-types.ts"
	 */
	outputPath?: string;
	/**
	 * Route URL prefix
	 * @default "/api"
	 */
	prefix?: string;
	/**
	 * Name of the exported type
	 * @default "Routes"
	 */
	typeName?: string;
	/**
	 * Whether to use explicit `export type` or `declare global`
	 * @default true
	 */
	useExport?: boolean;
	/**
	 * Import path of App relative to output file directory
	 * @default "./index"
	 */
	appImport?: string;
	/**
	 * File glob pattern to find route files
	 * @default "**\/*.{ts,tsx,js,jsx,mjs,cjs}"
	 */
	pattern?: string;
	/**
	 * File glob patterns to ignore
	 * @default ["**\/*.test.ts", "**\/*.spec.ts"]
	 */
	ignore?: string[];
	/**
	 * Fail if no route files are found
	 * @default true
	 */
	failGlob?: boolean;
}

/**
 * Proactively generate routes-types.ts for Elysia autoload routes,
 * based on the generation method in packages/elysia-autoload/src/index.ts (lines 187 - 222).
 */
export async function generateRoutesTypes(options: GenerateRoutesTypesOptions = {}) {
	const repoRoot = path.resolve(import.meta.dir, "..");
	const defaultRoutesDir = path.resolve(repoRoot, "apps/backend/src/modules");
	const defaultOutputPath = path.resolve(repoRoot, "apps/backend/src/routes-types.ts");

	const directoryPath = path.resolve(options.routesDir || defaultRoutesDir);
	const outputAbsolutePath = path.resolve(options.outputPath || defaultOutputPath);
	const prefix = fixSlashes(options.prefix ?? "/api");
	const typeName = options.typeName ?? "Routes";
	const useExport = options.useExport ?? true;
	const appImport = options.appImport ?? "./App";
	const globPattern = options.pattern || "**/*.routes.ts"; //"**/*.{ts,tsx,js,jsx,mjs,cjs}";
	const ignore = options.ignore ?? ["**/*.test.ts", "**/*.spec.ts"];
	const failGlob = options.failGlob ?? true;

	if (!fs.existsSync(directoryPath)) {
		throw new Error(`Routes directory does not exist: ${directoryPath}`);
	}
	if (!fs.statSync(directoryPath).isDirectory()) {
		throw new Error(`Routes path is not a directory: ${directoryPath}`);
	}

	const files = globSync(globPattern, { cwd: directoryPath });

	if (ignore && ignore.length > 0) {
		files.forEach((v, idx) => {
			if (ignore.some(pat => matchesPattern(v, pat))) {
				files[idx] = "";
			}
		});
	}

	const validFiles = files.filter(Boolean);

	if (failGlob && validFiles.length === 0) {
		throw new Error(`No route files found in ${directoryPath}`);
	}

	const paths: [relPath: string, exportName: string][] = [];

	for (const filePath of sortByNestedParams(validFiles)) {
		const fullPath = path.join(directoryPath, filePath);
		let exportName = "default";

		try {
			const fileModule = await import(pathToFileURL(fullPath).href);
			if (fileModule.default) {
				exportName = "default";
			} else {
				const keys = Object.keys(fileModule);
				exportName = keys[0] || "default";
			}
		} catch {
			// Fallback: If dynamic module evaluation fails (e.g. uninitialized DB connection or missing env vars),
			// inspect file contents statically without executing runtime code.
			try {
				const content = fs.readFileSync(fullPath, "utf-8");
				if (content.includes("export default")) {
					exportName = "default";
				} else {
					const namedExportMatch = content.match(/export\s+(?:const|function|let|var)\s+([a-zA-Z0-9_$]+)/);
					if (namedExportMatch?.[1]) {
						exportName = namedExportMatch[1];
					}
				}
			} catch {
				exportName = "default";
			}
		}

		paths.push([fullPath.replace(directoryPath, ""), exportName]);
	}

	// Lines 187 - 222 logic from packages/elysia-autoload/src/index.ts
	const importRoutes: string[] = paths.map(
		([x, exportName], index) =>
			`import type ${exportName === "default" ? `Route${index}` : `{ ${exportName} as Route${index} }`} from "${addRelativeIfNotDot(
				path
					.relative(path.dirname(outputAbsolutePath), directoryPath + x.replace(/\.(ts|tsx)$/, ""))
					.replaceAll("\\", "/"),
			)}";`,
	);

	const input = [
		`import type { ElysiaWithBaseUrl } from "elysia-autoload";`,
		`import type { App } from "${appImport}";`,
		importRoutes.join("\n"),
		"",
		!useExport ? "declare global {" : "",
		`    export type ${typeName} = App${paths.length > 0 ? " & " : ""}${paths
			.map(
				([x], index) =>
					`ElysiaWithBaseUrl<"${
						((prefix?.endsWith("/") ? prefix.slice(0, -1) : prefix) ?? "") + transformToUrl(x) || "/"
					}", typeof Route${index}>`,
			)
			.join("\n              & ")}`,
		!useExport ? "}" : "",
	].join("\n");

	const outDir = path.dirname(outputAbsolutePath);
	if (!fs.existsSync(outDir)) {
		fs.mkdirSync(outDir, { recursive: true });
	}

	if (typeof Bun === "undefined") {
		fs.writeFileSync(outputAbsolutePath, input);
	} else {
		await Bun.write(outputAbsolutePath, input);
	}

	return {
		outputPath: outputAbsolutePath,
		routesCount: paths.length,
		routes: paths.map(([x, exportName], index) => ({
			index,
			exportName,
			path: x.replaceAll("\\", "/"),
			url: ((prefix?.endsWith("/") ? prefix.slice(0, -1) : prefix) ?? "") + transformToUrl(x) || "/",
		})),
	};
}

// CLI execution
if (import.meta.main) {
	const { values } = parseArgs({
		args: process.argv.slice(2),
		options: {
			routes: { type: "string", short: "r" },
			output: { type: "string", short: "o" },
			prefix: { type: "string", short: "p" },
			typeName: { type: "string", short: "t" },
			watch: { type: "boolean", short: "w", default: false },
			help: { type: "boolean", short: "h", default: false },
		},
		allowPositionals: true,
	});

	if (values.help) {
		console.log(`
Usage: bun scripts/generate-routes-types.ts [options]

Options:
  -r, --routes <dir>     Path to routes directory (default: apps/backend/src/routes)
  -o, --output <file>    Path to output routes-types.ts (default: apps/backend/src/routes-types.ts)
  -p, --prefix <prefix>  Route prefix (default: /api)
  -t, --typeName <name>  Type name (default: Routes)
  -w, --watch            Watch routes directory and regenerate automatically on changes
  -h, --help             Show help
`);
		process.exit(0);
	}

	const runGeneration = async () => {
		const startTime = performance.now();
		try {
			const result = await generateRoutesTypes({
				routesDir: values.routes,
				outputPath: values.output,
				prefix: values.prefix,
				typeName: values.typeName,
			});

			const elapsed = (performance.now() - startTime).toFixed(1);
			console.log(`\n✨ Successfully generated routes-types (${result.routesCount} routes) in ${elapsed}ms:`);
			for (const r of result.routes) {
				console.log(`   Route${r.index}: ${r.path} -> ${r.url}`);
			}
			console.log(`📝 Output: ${result.outputPath}\n`);
		} catch (error) {
			console.error("❌ Failed to generate routes-types:", error);
			if (!values.watch) {
				process.exit(1);
			}
		}
	};

	await runGeneration();

	if (values.watch) {
		const repoRoot = path.resolve(import.meta.dir, "..");
		const targetDir = path.resolve(values.routes || path.join(repoRoot, "apps/backend/src/modules"));
		console.log(`👀 Watching for route changes in ${targetDir} ...`);

		let debounceTimer: ReturnType<typeof setTimeout> | null = null;
		fs.watch(targetDir, { recursive: true }, (_eventType, filename) => {
			if (!filename || filename.includes(".test.") || filename.includes(".spec.")) return;
			if (debounceTimer) clearTimeout(debounceTimer);
			debounceTimer = setTimeout(() => {
				console.log(`🔄 Route change detected (${filename}), regenerating...`);
				runGeneration();
			}, 150);
		});
	}
}
