import { User, userManager, type TUser } from "./user";
import type { WebSocketHandler } from "bun";
import { getUserFromToken } from "./verifyToken";
import { chatManager } from "./chat";

import {
	ACCEPT_JOIN_CALL,
	DELETE_MESSAGE_FROM_CHAT,
	LEAVE_CALL,
	MOVEMENT,
	RECEIVE_MESSAGE_IN_CHAT,
	REJECT_JOIN_CALL,
	REMOVE_USER_FROM_CHAT,
	REMOVED_FROM_CHAT,
	REQUEST_CHAT_MESSAGE,
	REQUEST_JOIN_CALL,
	SEND_MESSAGE_IN_CHAT,
} from "./constants";

export type SocketData = {
	user: TUser;
	location: { longitude: number; latitude: number };
};

const handleMessage = (
	ws: Bun.ServerWebSocket<SocketData>,
	message: string | Buffer<ArrayBufferLike>
) => {
	const parsedMessage = JSON.parse(String(message));
	const payload = parsedMessage.payload;
	switch (parsedMessage.type) {
		case MOVEMENT:
			const socketUser = userManager.getUser(ws.data.user.id);
			if (socketUser) {
				socketUser.updateLocation(payload);
				// TODO: SEND EVENT TO USER WHO IS AROUND / NEAR YOU
			}
			break;
		case REQUEST_CHAT_MESSAGE:
			const creatorSocket = userManager.getUser(payload.requestBy);
			const requestedSocket = userManager.getUser(payload.requestTo);
			if (creatorSocket && requestedSocket) {
				const userId = creatorSocket.getUserId();
				const chat = chatManager.createChat(userId, creatorSocket);
				chat.addParticipant(requestedSocket);
				requestedSocket.getSocket().send(
					JSON.stringify({
						type: REQUEST_CHAT_MESSAGE,
						payload: {
							requestBy: {
								id: creatorSocket.getUserId(),
								location: creatorSocket.getLocation(),
								image: creatorSocket.getImage(),
								interests: creatorSocket.getInterests(),
								username: creatorSocket.username,
							},
						},
					})
				);
			}
			break;
		case SEND_MESSAGE_IN_CHAT: {
			const senderUser = userManager.getUser(payload.sender);
			const chat = chatManager.getChat(payload.chatId);
			if (senderUser && chat) {
				const senderUserId = senderUser.getUserId();
				chat.broadcastMessage(
					JSON.stringify({
						type: RECEIVE_MESSAGE_IN_CHAT,
						payload: {
							sender: {
								id: senderUser.getUserId(),
								image: senderUser.getImage(),
								username: senderUser.username,
							},
							messageId: senderUserId,
							content: payload.content,
						},
					}),
					senderUserId
				);
			}
			break;
		}
		case DELETE_MESSAGE_FROM_CHAT: {
			const senderUser = userManager.getUser(payload.sender);
			const chat = chatManager.getChat(payload.chatId);
			if (chat && senderUser) {
				const senderUserId = senderUser.getUserId();
				chat.broadcastMessage(
					JSON.stringify({
						type: DELETE_MESSAGE_FROM_CHAT,
						payload: {
							messageId: payload.messageId,
						},
					}),
					senderUserId
				);
			}
			break;
		}
		case REMOVE_USER_FROM_CHAT:
			const senderUser = userManager.getUser(payload.sender);
			const chat = chatManager.getChat(payload.chatId);
			if (senderUser && chat) {
				const senderId = senderUser.getUserId();
				if (senderId === chat.chatId) {
					const requestUser = userManager.getUser(payload.requestRemoveUserId);
					chatManager.removeUserFromChat(requestUser!);
					requestUser?.getSocket().send(
						JSON.stringify({
							type: REMOVED_FROM_CHAT,
							payload: {
								chatId: chat.chatId,
							},
						})
					);
					// TODO: REMOVE USER IF IN MEDIASOUP
				}
			}
			break;
		case LEAVE_CALL:
			{
				const senderUser = userManager.getUser(payload.sender);
				const chat = chatManager.getChat(payload.chatId);

				if (senderUser && chat) {
					const socketUserId = senderUser.getUserId();
					chat.removeParticipant(senderUser);
					chat.broadcastMessage(
						JSON.stringify({
							type: LEAVE_CALL,
							payload: {
								leftBy: {
									id: senderUser.getUserId(),
									image: senderUser.getImage(),
									username: senderUser.username,
								},
							},
						}),
						socketUserId
					);
				}
			}
			break;
		case REQUEST_JOIN_CALL:
			{
				const senderUser = userManager.getUser(payload.requestBy);
				const receiverUser = userManager.getUser(payload.requestTo);
				if (senderUser && receiverUser) {
					receiverUser.getSocket().send(
						JSON.stringify({
							type: REQUEST_JOIN_CALL,
							payload: {
								requestBy: {
									id: senderUser.getUserId(),
									image: senderUser.getImage(),
									username: senderUser.username,
								},
							},
						})
					);
				}
			}
			break;
		case ACCEPT_JOIN_CALL:
			{
				const acceptedByUser = userManager.getUser(payload.acceptedBy);
				const acceptedToUser = userManager.getUser(payload.acceptedTo);
				const chat = chatManager.getChat(payload.chatId);
				if (acceptedByUser && acceptedToUser && chat) {
					const adminId = acceptedToUser.getUserId();
					const chat = chatManager.createChat(adminId, acceptedToUser);
					chat.addParticipant(acceptedByUser);

					//TODO: MAKE MEDIASOUP CONNECTION LOGIC
					// handle exchang webrtc ice candidates logic
					// handle exchange remote and local description exchange with MEDIASOUP
				}
			}
			break;
		case REJECT_JOIN_CALL:
			{
				const rejectedBy = userManager.getUser(payload.rejectedBy);
				const rejectedTo = userManager.getUser(payload.rejectedTo);
				if (rejectedBy && rejectedTo) {
					rejectedTo.getSocket().send(
						JSON.stringify({
							type: REJECT_JOIN_CALL,
							payload: {
								rejectedBy: {
									id: rejectedBy.getUserId(),
									username: rejectedBy.username,
									iamge: rejectedBy.getImage(),
								},
							},
						})
					);
				}
			}
			break;
	}
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
