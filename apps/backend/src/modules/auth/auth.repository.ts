import { menuRepository } from "../menu/menu.repository";
import { roleRepository } from "../role/role.repository";
import { userRepository } from "../user/user.repository";

export const authRepository = {
	findUserByEmail: userRepository.findByEmail,
	findRolesByIds: roleRepository.findByIds,
	findMenusByIds: menuRepository.findByIds,
	updatePassword: userRepository.updatePassword,
};

export type AuthRepository = typeof authRepository;
