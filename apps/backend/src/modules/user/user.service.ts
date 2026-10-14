import { AppError } from "@be/shared/errors/app-error";
import { hashPassword } from "@be/shared/utils/crypto";
import { type UserRepository, userRepository } from "./user.repository";
import type { CreateUser, UpdateUser } from "./user.schema";

export function createUserService(userRepo: UserRepository = userRepository) {
	return {
		async listUsers() {
			return userRepo.findAll();
		},

		async getUserById(id: number) {
			const user = await userRepo.findById(id);
			if (!user) {
				throw AppError.notFound("User not found");
			}
			return user;
		},

		async createUser(data: CreateUser) {
			const { salt, hpass } = hashPassword(data.password);
			return userRepo.create({
				email: data.email,
				username: data.username || data.email.split("@")[0],
				avatar: data.avatar || "",
				status: data.status !== undefined ? data.status : true,
				roles: data.roles || [],
				hpass,
				salt,
			});
		},

		async updateUser(data: UpdateUser) {
			const { id, password, ...rest } = data;
			// biome-ignore lint/suspicious/noExplicitAny: dynamic update object
			const updateData: Record<string, any> = { ...rest };

			if (password) {
				const { salt, hpass } = hashPassword(password);
				updateData.salt = salt;
				updateData.hpass = hpass;
			}

			const result = await userRepo.update(id, updateData);
			if (!result) {
				throw AppError.notFound("User not found");
			}
			return { status: 0, id: result.id };
		},

		async deleteUser(id: number) {
			const result = await userRepo.delete(id);
			return { status: 0, data: result };
		},
	};
}

export const userService = createUserService();
export type UserService = ReturnType<typeof createUserService>;
