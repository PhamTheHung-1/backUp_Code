import { db } from "@be/db";
import { eq } from "drizzle-orm";
import { usersTableSchema as users } from "./user.schema";

export type UserSelect = typeof users.$inferSelect;
export type SafeUserSelect = {
	id: number;
	email: string | null;
	username: string | null;
	avatar: string | null;
	status: boolean | null;
	roles: number[] | null;
	createdAt: Date | null;
	updatedAt: Date | null;
};

export const userRepository = {
	async findAll(): Promise<SafeUserSelect[]> {
		return db
			.select({
				id: users.id,
				email: users.email,
				username: users.username,
				avatar: users.avatar,
				status: users.status,
				roles: users.roles,
				createdAt: users.createdAt,
				updatedAt: users.updatedAt,
			})
			.from(users);
	},

	async findById(id: number): Promise<SafeUserSelect | null> {
		const result = await db
			.select({
				id: users.id,
				email: users.email,
				username: users.username,
				avatar: users.avatar,
				status: users.status,
				roles: users.roles,
				createdAt: users.createdAt,
				updatedAt: users.updatedAt,
			})
			.from(users)
			.where(eq(users.id, id));

		return result[0] ?? null;
	},

	async findFullById(id: number): Promise<UserSelect | null> {
		const result = await db.select().from(users).where(eq(users.id, id));
		return result[0] ?? null;
	},

	async findByEmail(email: string): Promise<UserSelect | null> {
		const result = await db.select().from(users).where(eq(users.email, email));
		return result[0] ?? null;
	},

	async create(data: {
		email: string;
		username: string;
		avatar: string;
		status: boolean;
		roles: number[];
		hpass: string;
		salt: string;
	}): Promise<{ id: number }> {
		const result = await db.insert(users).values(data).returning({ id: users.id });
		return result[0];
	},

	// biome-ignore lint/suspicious/noExplicitAny: dynamic update object
	async update(id: number, data: Record<string, any>): Promise<{ id: number } | null> {
		const result = await db.update(users).set(data).where(eq(users.id, id)).returning({ id: users.id });
		return result[0] ?? null;
	},

	async updatePassword(id: number, salt: string, hpass: string) {
		return db.update(users).set({ salt, hpass }).where(eq(users.id, id));
	},

	async delete(id: number) {
		return db.delete(users).where(eq(users.id, id));
	},
};

export type UserRepository = typeof userRepository;
