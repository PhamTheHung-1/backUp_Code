import { AppError } from "@be/shared/errors/app-error";
import { hashPassword, verifyPassword } from "@be/shared/utils/crypto";
import type { Menu } from "../menu/menu.schema";
import { type AuthRepository, authRepository } from "./auth.repository";

export interface JWTSigner {
	sign(payload: { username: string | null; roles: number[] | null }): Promise<string>;
}

export function createAuthService(repo: AuthRepository = authRepository) {
	return {
		async login(credentials: { username: string; password: string }, jwt?: JWTSigner) {
			const user = await repo.findUserByEmail(credentials.username);

			if (!user) {
				throw AppError.unauthorized("Wrong username");
			}

			if (!user.salt || !user.hpass) {
				throw AppError.unauthorized("User info in DB is error");
			}

			const isPasswordValid = verifyPassword(credentials.password, user.salt, user.hpass);
			if (!isPasswordValid) {
				throw AppError.unauthorized("Wrong Password");
			}

			const token = jwt
				? await jwt.sign({
						username: user.email,
						roles: user.roles,
					})
				: null;

			let menuList: Menu[] = [];

			if (user?.roles?.length) {
				const roleList = await repo.findRolesByIds(user.roles);
				const menuIds: number[] = [];
				roleList.forEach(r => {
					if (r.menus) menuIds.push(...r.menus);
					if (r.hmenus) menuIds.push(...r.hmenus);
				});

				if (menuIds.length) {
					menuList = await repo.findMenusByIds(menuIds);
				}
			}

			return {
				user: {
					id: user.id,
					email: user.email,
					username: user.username || user.email?.split("@")[0] || "",
					avatar: user.avatar || "",
					status: user.status ?? true,
					roles: user.roles ?? [],
					menus: menuList,
				},
				token: token ?? null,
			};
		},

		async changePasswordByEmail(email: string, oldPass: string, newPass: string) {
			const user = await repo.findUserByEmail(email);

			if (!user) {
				throw AppError.notFound("User not found");
			}

			if (!user.salt || !user.hpass) {
				throw AppError.internal("User security data error");
			}

			const isOldPasswordValid = verifyPassword(oldPass, user.salt, user.hpass);
			if (!isOldPasswordValid) {
				throw AppError.badRequest("Mật khẩu cũ không chính xác");
			}

			const { salt: newSalt, hpass: newHpass } = hashPassword(newPass);
			await repo.updatePassword(user.id, newSalt, newHpass);

			return { status: 0, message: "Đổi mật khẩu thành công" };
		},
	};
}

export const authService = createAuthService();
export type AuthService = ReturnType<typeof createAuthService>;
