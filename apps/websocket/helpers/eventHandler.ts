import {
	ACCEPT_JOIN_CALL,
	CONNECT_CONSUMER,
	CONNECT_CONSUMER_TRANSPORT,
	CONNECT_PRODUCER,
	CONNECT_PRODUCER_TRANSPORT,
	CREATE_CONSUMER_TRANSPORT,
	CREATE_PRODUCER_TRANSPORT,
	DELETE_MESSAGE_FROM_CHAT,
	GET_ROUTER_RTP_CAPABILITIES,
	LEAVE_CALL,
	MOVEMENT,
	RECEIVE_MESSAGE_IN_CHAT,
	REJECT_JOIN_CALL,
	REMOVE_USER_FROM_CHAT,
	REMOVED_FROM_CHAT,
	REQUEST_CHAT_MESSAGE,
	REQUEST_JOIN_CALL,
	RESUME_TRANSPORT,
	SEND_MESSAGE_IN_CHAT,
} from "../src/constants";
import type { SocketData } from "../src";
import { userManager } from "../src/user";
import { chatManager } from "../src/chat";
import { createClient } from "redis-config";

const socketPubClient = createClient();

(async () => {
	await socketPubClient
		.on("error", (err) => {
			console.error("Something went wrong while connecting redis client", err);
		})
		.connect();
})();

export const handleMessage = async (
	ws: Bun.ServerWebSocket<SocketData>,
	message: string | Buffer<ArrayBufferLike>
) => {
	const parsedMessage = JSON.parse(String(message));
	const payload = parsedMessage.payload;
	const senderUser = userManager.getUser(payload.sender);
	switch (parsedMessage.type) {
		case MOVEMENT:
			if (senderUser) {
				senderUser.updateLocation(payload);
				// TODO: SEND EVENT TO USER WHO IS AROUND / NEAR YOU
			}
			break;
		case REQUEST_CHAT_MESSAGE:
			const requestedSocket = userManager.getUser(payload.requestTo);
			if (senderUser && requestedSocket) {
				const userId = senderUser.getUserId();
				const chat = chatManager.createChat(userId, senderUser);
				chat.addParticipant(requestedSocket);
				requestedSocket.getSocket().send(
					JSON.stringify({
						type: REQUEST_CHAT_MESSAGE,
						payload: {
							requestBy: {
								id: senderUser.getUserId(),
								location: senderUser.getLocation(),
								image: senderUser.getImage(),
								interests: senderUser.getInterests(),
								username: senderUser.username,
							},
						},
					})
				);
			}
			break;
		case SEND_MESSAGE_IN_CHAT: {
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
				const acceptedToUser = userManager.getUser(payload.acceptedTo);
				const chat = chatManager.getChat(payload.chatId);
				if (senderUser && acceptedToUser && chat) {
					const adminId = acceptedToUser.getUserId();
					const chat = chatManager.createChat(adminId, acceptedToUser);
					chat.addParticipant(senderUser);

					//TODO: MAKE MEDIASOUP CONNECTION LOGIC
					// handle exchang webrtc ice candidates logic
					// handle exchange remote and local description exchange with MEDIASOUP
				}
			}
			break;
		case REJECT_JOIN_CALL:
			{
				const rejectedTo = userManager.getUser(payload.rejectedTo);
				if (senderUser && rejectedTo) {
					rejectedTo.getSocket().send(
						JSON.stringify({
							type: REJECT_JOIN_CALL,
							payload: {
								rejectedBy: {
									id: senderUser.getUserId(),
									username: senderUser.username,
									iamge: senderUser.getImage(),
								},
							},
						})
					);
				}
			}
			break;
		case GET_ROUTER_RTP_CAPABILITIES: {
			if (senderUser) {
				const senderUserId = senderUser.getUserId();

				await socketPubClient.publish(
					"mediasoup:getRouterRtpCapabilities",
					JSON.stringify({ userId: senderUserId })
				);
			}
			break;
		}
		case CREATE_PRODUCER_TRANSPORT: {
			// send rtp capabilities comes from client
			const senderUser = userManager.getUser(payload.userId);
			if (senderUser) {
				await socketPubClient.publish(
					"mediasoup:createProducerTransport",
					JSON.stringify({
						rtpCapabilities: payload.rtpCapabilities,
						userId: senderUser.userId,
					})
				);
			}
			break;
		}
		case CONNECT_PRODUCER_TRANSPORT: {
			// send dtlsParameters comes from client

			const senderUser = userManager.getUser(payload.userId);
			if (senderUser) {
				await socketPubClient.publish(
					"mediasoup:connectProducerTransport",
					JSON.stringify({
						userId: senderUser.userId,
						dtlsParameters: payload.dtlsParameters,
					})
				);
			}
			break;
		}
		case CONNECT_PRODUCER: {
			const senderUser = userManager.getUser(payload.userId);
			const chat = chatManager.getChat(payload.chatId);
			if (senderUser && chat) {
				await socketPubClient.publish(
					"mediasoup:produce",
					JSON.stringify({
						userId: senderUser.userId,
						chatId: chat.chatId,
						kind: payload.kind,
						rtpParameters: payload.rtpParameters,
					})
				);
			}
			break;
		}
		case CREATE_CONSUMER_TRANSPORT: {
			const senderUser = userManager.getUser(payload.userId);
			if (senderUser) {
				// TODO: NOT SURE NOW,
				// SEND RTPCAPABILITIIES
				await socketPubClient.publish(
					"mediasoup:createConsumerTransport",
					JSON.stringify({
						userId: senderUser.userId,
					})
				);
			}
			break;
		}
		case CONNECT_CONSUMER_TRANSPORT: {
			const senderUser = userManager.getUser(payload.userId);
			socketPubClient.publish(
				"mediasoup:connectConsumerTransport",
				JSON.stringify({})
			);
			break;
		}
		case CONNECT_CONSUMER: {
			const senderUser = userManager.getUser(payload.userId);
			socketPubClient.publish("mediasoup:consume", JSON.stringify({}));
			break;
		}
		case RESUME_TRANSPORT: {
			const senderUser = userManager.getUser(payload.userId);
			socketPubClient.publish("mediasoup:resume", JSON.stringify({}));
			break;
		}
	}
};
