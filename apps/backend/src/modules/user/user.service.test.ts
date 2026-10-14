import { describe, expect, it } from "bun:test";
import { AppError } from "@be/shared/errors/app-error";
import type { UserRepository } from "./user.repository";
import { createUserService } from "./user.service";

describe("UserService", () => {
	it("should return user by id when exists", async () => {
		const mockRepo: UserRepository = {
			findAll: async () => [],
			findById: async (id: number) => ({
				id,
				email: "user@test.com",
				username: "user",
				avatar: "",
				status: true,
				roles: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
			findFullById: async () => null,
			findByEmail: async () => null,
			create: async () => ({ id: 1 }),
			update: async () => ({ id: 1 }),
			// biome-ignore lint/suspicious/noExplicitAny: mock in unit test
			updatePassword: async () => ({}) as any,
			// biome-ignore lint/suspicious/noExplicitAny: mock in unit test
			delete: async () => ({ rowCount: 1 }) as any,
		};

		const userService = createUserService(mockRepo);
		const user = await userService.getUserById(1);
		expect(user.id).toBe(1);
		expect(user.email).toBe("user@test.com");
	});

	it("should throw not found when user does not exist", async () => {
		const mockRepo: UserRepository = {
			findAll: async () => [],
			findById: async () => null,
			findFullById: async () => null,
			findByEmail: async () => null,
			create: async () => ({ id: 1 }),
			update: async () => null,
			// biome-ignore lint/suspicious/noExplicitAny: mock in unit test
			updatePassword: async () => ({}) as any,
			// biome-ignore lint/suspicious/noExplicitAny: mock in unit test
			delete: async () => ({}) as any,
		};

		const userService = createUserService(mockRepo);
		expect(userService.getUserById(999)).rejects.toThrow(AppError.notFound("User not found"));
	});
});
