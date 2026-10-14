import { describe, expect, it } from "bun:test";
import { AppError } from "@be/shared/errors/app-error";
import { hashPassword, verifyPassword } from "@be/shared/utils/crypto";
import type { AuthRepository } from "./auth.repository";
import { createAuthService } from "./auth.service";

describe("AuthService", () => {
	const mockPassword = "password123";
	const { salt, hpass } = hashPassword(mockPassword);

	const mockUser = {
		id: 1,
		email: "test@example.com",
		username: "testuser",
		avatar: "",
		status: true,
		roles: [1],
		salt,
		hpass,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	it("should hash and verify password correctly", () => {
		expect(verifyPassword(mockPassword, salt, hpass)).toBe(true);
		expect(verifyPassword("wrongpass", salt, hpass)).toBe(false);
	});

	it("should login successfully with correct credentials", async () => {
		const mockRepo: AuthRepository = {
			findUserByEmail: async (email: string) => (email === mockUser.email ? mockUser : null),
			findRolesByIds: async () => [
				{
					id: 1,
					name: "Admin",
					desc: null,
					menus: [10],
					hmenus: [],
					apis: [],
					status: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			],
			// biome-ignore lint/suspicious/noExplicitAny: mock in unit test
			findMenusByIds: async () => [{ id: 10, name: "Dashboard", active: true } as any],
			// biome-ignore lint/suspicious/noExplicitAny: mock in unit test
			updatePassword: async () => ({}) as any,
		};

		const authService = createAuthService(mockRepo);
		const result = await authService.login({ username: "test@example.com", password: mockPassword }, { sign: async () => "mock-jwt-token" });

		expect(result.token).toBe("mock-jwt-token");
		expect(result.user.email).toBe("test@example.com");
		expect(result.user.menus.length).toBe(1);
	});

	it("should throw unauthorized when user is not found", async () => {
		const mockRepo: AuthRepository = {
			findUserByEmail: async () => null,
			findRolesByIds: async () => [],
			findMenusByIds: async () => [],
			// biome-ignore lint/suspicious/noExplicitAny: mock in unit test
			updatePassword: async () => ({}) as any,
		};

		const authService = createAuthService(mockRepo);
		expect(authService.login({ username: "unknown@example.com", password: "123" })).rejects.toThrow(AppError.unauthorized("Wrong username"));
	});

	it("should throw unauthorized on wrong password", async () => {
		const mockRepo: AuthRepository = {
			findUserByEmail: async () => mockUser,
			findRolesByIds: async () => [],
			findMenusByIds: async () => [],
			// biome-ignore lint/suspicious/noExplicitAny: mock in unit test
			updatePassword: async () => ({}) as any,
		};

		const authService = createAuthService(mockRepo);
		expect(authService.login({ username: mockUser.email, password: "incorrect" })).rejects.toThrow(AppError.unauthorized("Wrong Password"));
	});
});
