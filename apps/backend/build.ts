import { autoload } from "esbuild-plugin-autoload"; // default import also supported

await Bun.build({
	entrypoints: ["./src/index.ts"],
	target: "bun",
	outdir: "./dist",
	sourcemap: false,
	define: { "process.env.nonExportedType": "true" }, //to turnoff exporting types when build production
	plugins: [
		autoload({
			pattern: "**/*.{ts,tsx,js,jsx,mjs,cjs}",
			directory: "./src/routes",
		}),
	],
}).then(console.log);

await Bun.$`bun build --compile --target bun --packages external --outfile ./server ./dist/index.js`;
