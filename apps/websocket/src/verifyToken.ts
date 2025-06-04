import jwt from "jsonwebtoken";
import type { TUser } from "./user";

export const getUserFromToken = (token: string) => {
	try {
		const decoded = jwt.verify(token, process.env.AUTH_SECRET!) as TUser;
		return decoded;
	} catch (error) {
		console.error("Invalid token,", error);
		return null;
	}
};
