import fs from "node:fs";
import path from "node:path";

const backendRoot = path.resolve(import.meta.dir, "..");
const routesDirs = [path.join(backendRoot, "src/routes"), path.join(backendRoot, "src/modules")];

const FORBIDDEN_IMPORTS = [
	{ pattern: /from\s+["'].*\/db["']/, name: "direct DB import" },
	{ pattern: /from\s+["']@be\/db["']/, name: "direct @be/db import" },
	{ pattern: /from\s+["']drizzle-orm["']/, name: "direct drizzle-orm import in routes" },
];

let violationsCount = 0;

function scanDir(dir: string, isRouteScan = false) {
	if (!fs.existsSync(dir)) return;

	const entries = fs.readdirSync(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			scanDir(fullPath, isRouteScan || entry.name === "routes");
		} else if (entry.isFile() && (entry.name.endsWith(".routes.ts") || (isRouteScan && entry.name.endsWith(".ts")))) {
			const content = fs.readFileSync(fullPath, "utf-8");
			const lines = content.split("\n");

			lines.forEach((line, index) => {
				for (const rule of FORBIDDEN_IMPORTS) {
					if (rule.pattern.test(line)) {
						const relPath = path.relative(backendRoot, fullPath);
						console.error(
							`❌ [Architecture Violation] in ${relPath}:${index + 1}\n` +
								`   Rule: Routes must NOT access Database directly (${rule.name}).\n` +
								`   Found: ${line.trim()}\n` +
								`   Fix: Move database queries to .repository.ts and call through .service.ts.\n`,
						);
						violationsCount++;
					}
				}
			});
		}
	}
}

console.log("🔍 Scanning for architecture compliance in routes...");
for (const d of routesDirs) {
	scanDir(d, d.endsWith("routes"));
}

if (violationsCount > 0) {
	console.error(`\n💥 Architecture verification failed: ${violationsCount} violation(s) found!`);
	process.exit(1);
} else {
	console.log("✅ Architecture check passed: 100% clean separation of concerns! No direct DB calls in routes.");
	process.exit(0);
}
