import { beforeAll, describe, expect, it } from "bun:test";

let app: typeof import("../../App")["app"];

describe("Clinic context API authorization", () => {
	beforeAll(async () => {
		const originalArgv = process.argv[1];
		const originalJwtSecret = process.env.JWT_SECRET;
		process.argv[1] = "src/index.ts";
		if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "clinic-context-test-secret";
		try {
			({ app } = await import("../../App"));
		} finally {
			process.argv[1] = originalArgv;
			process.env.JWT_SECRET = originalJwtSecret ?? "";
		}
	});

	it("returns 401 for requests without an authenticated user", async () => {
		const response = await app.handle(new Request("http://localhost/api/clinic-context"));

		expect(response.status).toBe(401);
	});

	it("applies the existing authType middleware to autoloaded protected routes", async () => {
		const response = await app.handle(new Request("http://localhost/api/user/1"));

		expect(response.status).toBe(401);
	});

	it("returns 401 for invalid JWTs", async () => {
		const response = await app.handle(
			new Request("http://localhost/api/clinic-context", {
				headers: { authorization: "Bearer invalid-token" },
			}),
		);

		expect(response.status).toBe(401);
	});
});
