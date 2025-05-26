import jwt from "jsonwebtoken";
import type { TUser } from "./user";

export const getUserFromToken = (token: string) => {
	const decoded = jwt.verify(token, process.env.TOKEN_SECRET!) as TUser;
	return decoded;
};
