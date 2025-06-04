import {
	ACCEPT_JOIN_CALL,
	ACCEPT_START_CALL,
	CONNECT_CONSUMER,
	CONNECT_CONSUMER_TRANSPORT,
	CONNECT_PRODUCER,
	CONNECT_PRODUCER_TRANSPORT,
	CREATE_CONSUMER_TRANSPORT,
	CREATE_PRODUCER_TRANSPORT,
	DELETE_MESSAGE_FROM_CHAT,
	GET_ROUTER_RTP_CAPABILITIES,
	INCOMING_CALL,
	INCOMING_CALL_ACCEPTED,
	INCOMING_CALL_JOIN_ACCEPTED,
	INCOMING_CALL_JOIN_REQUEST,
	INCOMING_CALL_REJECTED,
	LEAVE_CALL,
	MOVEMENT,
	RECEIVE_MESSAGE_IN_CHAT,
	REJECT_INCOMING_CALL_JOIN_REQUEST,
	REJECT_JOIN_CALL,
	REJECT_START_CALL,
	REMOVE_USER_FROM_CHAT,
	REMOVED_FROM_CHAT,
	REQUEST_CHAT_MESSAGE,
	REQUEST_JOIN_CALL,
	REQUEST_START_CALL,
	RESUME_TRANSPORT,
	SEND_MESSAGE_IN_CHAT,
	SET_INTERESTS_AND_LOCATION,
} from "socket-events";
import type { SocketData } from "../src";
import { userManager } from "../src/user";
import { Chat, chatManager } from "../src/chat";
import { createClient } from "redis-config";

import "../src/redisSubscribe";

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
	if (!senderUser) return;
	switch (parsedMessage.type) {
		case SET_INTERESTS_AND_LOCATION: {
			senderUser.setInterests(payload.interests);
			senderUser.updateLocation({
				longitude: payload.location.lng,
				latitude: payload.location.lat,
			});
			break;
			// ✅✅✅
		}
		case MOVEMENT:
			if (senderUser) {
				senderUser.updateLocation(payload.location);
				// TODO: SEND EVENT TO USER WHO IS AROUND / NEAR YOU
			}
			break; // ✅✅✅

		case REQUEST_CHAT_MESSAGE:
			const requestedSocket = userManager.getUser(payload.requestTo);
			if (requestedSocket) {
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
			if (chat) {
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
			if (chat) {
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
			{
				const chat = chatManager.getChat(payload.chatId);
				if (chat) {
					const senderId = senderUser.getUserId();
					if (senderId === chat.chatId) {
						const requestUser = userManager.getUser(
							payload.requestRemoveUserId
						);
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
			}
			break;
		case LEAVE_CALL:
			{
				const chat = chatManager.getChat(payload.chatId);

				if (chat) {
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
		case REQUEST_START_CALL:
			{
				if (payload.chatId && senderUser) {
					const chat = chatManager.getChat(payload.chatId);
					if (chat) {
						chat.addParticipantInCall(senderUser);
						chat.broadcastMessage(
							JSON.stringify({
								type: INCOMING_CALL,
								payload: {
									chatId: chat.chatId,
									requestBy: {
										id: senderUser.getUserId(),
										image: senderUser.getImage(),
										username: senderUser.username,
									},
								},
							}),
							senderUser.userId
						);
					}
					break;
				}

				const receiverUser = userManager.getUser(payload.requestTo);
				if (receiverUser) {
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
		case ACCEPT_START_CALL:
			{
				const acceptedToUser = userManager.getUser(payload.acceptedTo);
				if (acceptedToUser) {
					const adminId = acceptedToUser.getUserId();
					let chat: Chat | undefined;
					if (payload.chatId) {
						chat = chatManager.getChat(payload.chatId);
						chat?.addParticipantInCall(senderUser);
					}
					chat = chatManager.createChat(adminId, acceptedToUser);

					// add paricipants in chat's space
					chat.addParticipant(senderUser);
					chat.addParticipant(acceptedToUser);

					// add paricipants in chat's call
					chat.addParticipantInCall(senderUser);
					chat.addParticipantInCall(acceptedToUser);

					acceptedToUser.getSocket().send(
						JSON.stringify({
							type: INCOMING_CALL_ACCEPTED,
							payload: {
								chatId: chat.chatId,
								acceptedBy: {
									userId: senderUser.userId,
									image: senderUser.getImage(),
									username: senderUser.username,
								},
							},
						})
					);

					await socketPubClient.publish(
						"mediasoup:getRouterRtpCapabilities",
						JSON.stringify({
							chatId: chat.chatId,
							userId: senderUser.userId,
						})
					);
				}
			}
			break;
		case REJECT_START_CALL:
			{
				const rejectedTo = userManager.getUser(payload.rejectedTo);
				if (rejectedTo) {
					rejectedTo.getSocket().send(
						JSON.stringify({
							type: INCOMING_CALL_REJECTED,
							payload: {
								rejectedBy: {
									id: senderUser.getUserId(),
									username: senderUser.username,
									image: senderUser.getImage(),
								},
							},
						})
					);
				}
			}
			break;
		case REQUEST_JOIN_CALL:
			{
				const chat = chatManager.getChat(payload.chatId);
				if (chat) {
					const chatAdmin = chat.admin;
					chatAdmin.getSocket().send(
						JSON.stringify({
							type: INCOMING_CALL_JOIN_REQUEST,
							payload: {
								id: senderUser.getUserId(),
								username: senderUser.username,
								image: senderUser.getImage(),
							},
						})
					);
				}
			}
			break;
		case ACCEPT_JOIN_CALL:
			{
				const acceptedTo = userManager.getUser(payload.acceptedTo);
				const chat = chatManager.getChat(payload.chatId);
				if (chat && acceptedTo) {
					chat.addParticipantInCall(acceptedTo);
					// TODO: may be some delay here,
					// to notify users in call
					// TODO: I don't think i should notify user now
					// Notify user when user produce the mediasoup

					await socketPubClient.publish(
						"mediasoup:getRouterRtpCapabilities",
						JSON.stringify({
							userId: acceptedTo.userId,
							chatId: chat.chatId,
						})
					);

					acceptedTo.getSocket().send(
						JSON.stringify({
							type: INCOMING_CALL_JOIN_ACCEPTED,
							payload: {
								chatId: chat.chatId,
							},
						})
					);

					// chat.currentParticipantsInCall.forEach((participant) => {
					// 	participant.getSocket().send(JSON.stringify({}));
					// });
				}
			}
			break;
		case REJECT_JOIN_CALL:
			{
				const rejectedTo = userManager.getUser(payload.rejectedTo);
				if (rejectedTo) {
					rejectedTo.getSocket().send(
						JSON.stringify({
							type: REJECT_INCOMING_CALL_JOIN_REQUEST,
							payload: {
								rejectedBy: {
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
			const chat = chatManager.getChat(payload.chatId);
			if (chat) {
				const senderUserId = senderUser.getUserId();

				await socketPubClient.publish(
					"mediasoup:getRouterRtpCapabilities",
					JSON.stringify({ userId: senderUserId, chatId: chat.chatId })
				);
			}
			break;
		}
		case CREATE_PRODUCER_TRANSPORT: {
			// send rtp capabilities comes from client
			const chat = chatManager.getChat(payload.chatId);
			if (chat) {
				await socketPubClient.publish(
					"mediasoup:createProducerTransport",
					JSON.stringify({
						rtpCapabilities: payload.rtpCapabilities,
						userId: senderUser.userId,
						chatId: chat.chatId,
					})
				);
			}
			break;
		}
		case CONNECT_PRODUCER_TRANSPORT: {
			// send dtlsParameters comes from client

			const chat = chatManager.getChat(payload.chatId);
			if (chat) {
				await socketPubClient.publish(
					"mediasoup:connectProducerTransport",
					JSON.stringify({
						userId: senderUser.userId,
						dtlsParameters: payload.dtlsParameters,
						chatId: chat.chatId,
					})
				);
			}
			break;
		}
		case CONNECT_PRODUCER: {
			const chat = chatManager.getChat(payload.chatId);
			if (chat) {
				await socketPubClient.publish(
					"mediasoup:produce",
					JSON.stringify({
						userId: senderUser.userId,
						chatId: chat.chatId,
						kind: payload.kind,
						rtpParameters: payload.rtpParameters,
						transportId: payload.transportId,
					})
				);
			}
			break;
		}
		case CREATE_CONSUMER_TRANSPORT: {
			const chat = chatManager.getChat(payload.chatId);
			if (chat) {
				// TODO: NOT SURE NOW,
				// SEND RTPCAPABILITIIES
				await socketPubClient.publish(
					"mediasoup:createConsumerTransport",
					JSON.stringify({
						userId: senderUser.userId,
						chatId: chat.chatId,
					})
				);
			}
			break;
		}
		case CONNECT_CONSUMER_TRANSPORT: {
			const chat = chatManager.getChat(payload.chatId);
			if (chat) {
				await socketPubClient.publish(
					"mediasoup:connectConsumerTransport",
					JSON.stringify({
						userId: senderUser.userId,
						params: payload.dtlsParameters,
						chatId: chat.chatId,
						transportId: payload.transportId,
					})
				);
			}
			break;
		}
		case CONNECT_CONSUMER: {
			const chat = chatManager.getChat(payload.chatId);
			if (chat) {
				await socketPubClient.publish(
					"mediasoup:consume",
					JSON.stringify({
						chatId: chat.chatId,
						userId: senderUser.userId,
						rtpCapabilities: payload.rtpCapabilites,
						transportId: payload.transportId,
						producerId: payload.producerId,
					})
				);
			}
			break;
		}
		case RESUME_TRANSPORT: {
			const chat = chatManager.getChat(payload.chatId);
			if (chat) {
				await socketPubClient.publish(
					"mediasoup:resume",
					JSON.stringify({
						userId: senderUser.userId,
						chatId: chat.chatId,
						consumerId: payload.consumerId,
					})
				);
			}
			break;
		}
	}
};
