import { User, userManager, type TUser } from "./user";
import type { WebSocketHandler } from "bun";
import { getUserFromToken } from "./verifyToken";
import { chatManager } from "./chat";
import { handleMessage } from "../helpers/eventHandler";

export type SocketData = {
	user: TUser;
	location: { longitude: number; latitude: number };
};

const websocketHandle: WebSocketHandler<SocketData> = {
	open(ws) {
		const socketUser = new User(
			ws.data.user.id,
			ws,
			ws.data.user.image,
			ws.data.location,
			ws.data.user.interests,
			ws.data.user.username
		);
		userManager.addUser(socketUser);
		console.log("Socket user created.");
	},
	message(ws, message) {
		handleMessage(ws, message);
	},
	close(ws, code, reason) {
		const socketUser = userManager.getUser(ws.data.user.id);
		if (socketUser) {
			userManager.removeUser(socketUser);
			chatManager.removeUserFromChat(socketUser);
		}
		console.log("socket close code: ", code);
		console.log("socket close reason", reason);
	},
	perMessageDeflate: true,
};

const server = Bun.serve({
	port: 8080,
	async fetch(req, server) {
		const url = new URL(req.url);
		const token = url.searchParams.get("token");
		const location = url.searchParams.get("location");
		if (!token) {
			return new Response("Unathenticated");
		}
		const user = getUserFromToken(token);
		if (!user) return new Response("Invalid token", { status: 403 });
		const success = server.upgrade(req, {
			data: {
				user,
				location,
			},
		});
		if (success) {
			return undefined;
		}
		return new Response("Failed to upgrage server");
	},
	websocket: websocketHandle,
});

console.log(`Listening on ${server.hostname}:${server.port}`);
