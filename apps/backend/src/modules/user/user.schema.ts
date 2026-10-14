import { usersTableSchema } from "@be/db/schema/user-schema";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { t } from "elysia";

// Override 'roles' array column để tránh lỗi "Type instantiation is excessively deep"
// từ drizzle-typebox khi xử lý smallint().array()
export const insertUserSchema = createInsertSchema(usersTableSchema, {
	roles: t.Optional(t.Array(t.Number())),
});

export const selectUserSchema = createSelectSchema(usersTableSchema, {
	roles: t.Nullable(t.Array(t.Number())),
});

// Schema an toàn dùng để trả về Client — không bao giờ lộ mật khẩu hash và muối
export const safeSelectUserSchema = t.Omit(selectUserSchema, ["hpass", "salt"]);
export type SafeUser = typeof safeSelectUserSchema.static;

// Schema tạo mới user
export const createUserSchema = t.Object({
	email: t.String(),
	password: t.String({ minLength: 6, maxLength: 50 }),
	username: t.Optional(t.String()),
	avatar: t.Optional(t.String()),
	status: t.Optional(t.Boolean()),
	roles: t.Optional(t.Array(t.Number())),
});
export type CreateUser = typeof createUserSchema.static;

// Schema cập nhật user (id bắt buộc, password tùy chọn nếu muốn đổi mật khẩu)
export const updateUserSchema = t.Object({
	id: t.Number(),
	email: t.Optional(t.String()),
	username: t.Optional(t.String()),
	avatar: t.Optional(t.String()),
	status: t.Optional(t.Boolean()),
	roles: t.Optional(t.Array(t.Number())),
	password: t.Optional(t.String({ minLength: 6, maxLength: 50 })),
});
export type UpdateUser = typeof updateUserSchema.static;

// Schema đổi mật khẩu của chính user đang đăng nhập
export const changePasswordSchema = t.Object({
	oldPassword: t.String(),
	newPassword: t.String({ minLength: 6, maxLength: 50 }),
});
export type ChangePassword = typeof changePasswordSchema.static;

export { usersTableSchema };
