import { User } from "./user";
import { WebSocketHandler } from "bun";
import { getUserFromToken } from "../../../helpers/verifyToken";

export type SocketData = {
	user: {
		id: string;
		image: string;
	};
};

const websocketHandle: WebSocketHandler<SocketData> = {
	open(ws) {
		const socketUser = new User(ws.data.user.id, ws);
	},
	message(ws, message) {},
	close() {},
	perMessageDeflate: true,
};

function parseCookie(cookieHeader: string, name: string) {
	const cookies = Object.fromEntries(
		cookieHeader.split(";").map((c) => {
			const [k, v] = c.trim().split("=");
			return [k, decodeURIComponent(v as string)];
		})
	);
	return cookies[name];
}

const server = Bun.serve({
	port: 8080,
	async fetch(req, server) {
		const cookie = req.headers.get("cookie");
		if (!cookie) return new Response("Unauthenticated");
		const token =
			parseCookie(cookie, "__Secure-next-auth.session-token") ??
			parseCookie(cookie, "next-auth.session-token");

		if (!token) {
			return new Response("Unauthenticated");
		}
		const user = await getUserFromToken(token);
		if (!user) {
			return new Response("Invalid token");
		}
		const success = server.upgrade(req, {
			data: {},
		});
		if (success) {
			return undefined;
		}
		return new Response("Hello world");
	},
	websocket: websocketHandle,
});

console.log(`Listening on ${server.hostname}:${server.port}`);
