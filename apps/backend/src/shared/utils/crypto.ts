import { createHmac, randomBytes } from "node:crypto";

export function hashPassword(password: string, existingSalt?: string) {
	const salt = existingSalt || randomBytes(16).toHex();
	const hpass = createHmac("sha256", salt).update(password).digest("hex");
	return { salt, hpass };
}

export function verifyPassword(password: string, salt: string, expectedHpass: string): boolean {
	const { hpass } = hashPassword(password, salt);
	return hpass === expectedHpass;
}
