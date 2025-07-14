import {
	ACCEPT_AUDIO_CALL,
	ACCEPT_INCOMING_AUDIO_CALL,
	ACCEPT_INCOMING_VIDEO_CALL,
	ACCEPT_VIDEO_CALL,
	AUDIO_CALL_ACCEPTED,
	AUDIO_CALL_REJECTED,
	CONNECT_CONSUMER,
	CONNECT_CONSUMER_TRANSPORT,
	CONNECT_PRODUCER,
	CONNECT_PRODUCER_TRANSPORT,
	CREATE_CONSUMER_TRANSPORT,
	CREATE_PRODUCER_TRANSPORT,
	DELETE_MESSAGE_FROM_CHAT,
	INCOMING_AUDIO_CALL,
	INCOMING_VIDEO_CALL,
	LEAVE_CALL,
	MOVEMENT,
	RECEIVE_MESSAGE_IN_CHAT,
	REJECT_AUDIO_CALL,
	REJECT_INCOMING_AUDIO_CALL,
	REJECT_INCOMING_VIDEO_CALL,
	REJECT_VIDEO_CALL,
	REMOVE_USER_FROM_CHAT,
	REMOVED_FROM_CHAT,
	REQUEST_AUDIO_CALL,
	REQUEST_VIDEO_CALL,
	RESUME_TRANSPORT,
	SEND_MESSAGE_IN_CHAT,
	SET_INTERESTS_AND_LOCATION,
	VIDEO_CALL_ACCEPTED,
	VIDEO_CALL_REJECTED,
} from "socket-events";
import type { SocketData } from "../src";
import { userManager } from "../src/user";
import { chatManager } from "../src/chat";
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
								name: senderUser.name,
							},
							messageId: payload.messageId,
							content: payload.content,
							chatId: chat.chatId,
						},
					}),
					senderUserId
				);
			} else {
				const requestedSocket = userManager.getUser(payload.requestTo);
				const createdChat = chatManager.createChat(payload.chatId, senderUser);
				if (requestedSocket) {
					createdChat.addParticipant(requestedSocket);
					requestedSocket.getSocket().send(
						JSON.stringify({
							type: RECEIVE_MESSAGE_IN_CHAT,
							payload: {
								sender: {
									id: senderUser.getUserId(),
									image: senderUser.getImage(),
									name: senderUser.name,
								},
								messageId: senderUser.userId,
								content: payload.content,
								chatId: createdChat.chatId,
							},
						})
					);
				}
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
							by: senderUser.userId,
							chatId: chat.chatId,
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
									removedUserId: requestUser.userId,
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
					socketPubClient.publish(
						"mediasoup:leaveCall",
						JSON.stringify({
							chatId: payload.chatId,
							userId: senderUser.userId,
						})
					);
				}
			}
			break;

		case REQUEST_AUDIO_CALL: {
			const chat = chatManager.getChat(payload.chatId);
			if (senderUser && chat) {
				chat.addParticipantInCall(senderUser);
				chat.broadcastMessage(
					JSON.stringify({
						type: INCOMING_AUDIO_CALL,
						payload: {
							sender: {
								id: senderUser.getUserId(),
								image: senderUser.getImage(),
								name: senderUser.name,
								interests: senderUser.interests,
							},
							chatId: chat.chatId,
						},
					}),
					senderUser.userId
				);
			} else {
				const requestedUser = userManager.getUser(payload.requestTo);
				if (!requestedUser) return;
				const newChat = chatManager.createChat(payload.chatId, senderUser);
				newChat.addParticipantInCall(senderUser);
				newChat.addParticipant(requestedUser);

				if (!requestedUser) return;

				requestedUser.getSocket().send(
					JSON.stringify({
						type: REQUEST_AUDIO_CALL,
						payload: {
							sender: {
								id: senderUser.getUserId(),
								image: senderUser.getImage(),
								name: senderUser.name,
								interests: senderUser.interests,
							},
							chatId: newChat.chatId,
						},
					})
				);
			}

			await socketPubClient.publish(
				"mediasoup:getRouterRtpCapabilities",
				JSON.stringify({
					chatId: payload.chatId,
					userId: senderUser.userId,
				})
			);
			break;
		}
		case ACCEPT_AUDIO_CALL: {
			const chat = chatManager.getChat(payload.chatId);
			console.log("yata tw sure aaunu parne ho what happened");
			console.log("chat is chat this hai", payload.chat, chat);
			if (!chat || !senderUser) return;
			chat.addParticipantInCall(senderUser);
			chat.broadcastInCall(
				JSON.stringify({
					type: AUDIO_CALL_ACCEPTED,
					payload: {
						chatId: chat.chatId,
						acceptedBy: {
							id: senderUser.getUserId(),
							image: senderUser.getImage(),
							name: senderUser.name,
						},
					},
				}),
				senderUser.userId
			);

			await socketPubClient.publish(
				"mediasoup:getRouterRtpCapabilities",
				JSON.stringify({
					chatId: chat.chatId,
					userId: senderUser.userId,
				})
			);
			break;
		}
		case REJECT_INCOMING_AUDIO_CALL: {
			const chat = chatManager.getChat(payload.chatId);
			if (!chat) return;
			chat.removeParticipantFromCall(senderUser);

			chat.broadcastMessage(
				JSON.stringify({
					type: AUDIO_CALL_REJECTED,
					payload: {
						rejectedBy: {
							id: senderUser.userId,
							image: senderUser.getImage(),
							name: senderUser.name,
						},
					},
				}),
				senderUser.userId
			);
			//TODO: REMOVE IN MEDIA SOUP
			break;
		}

		case REJECT_AUDIO_CALL: {
			const chat = chatManager.getChat(payload.chatId);
			if (!chat) return;
			//TODO: FOR NOW, NOT SURE WHAT TO DO

			chat.broadcastMessage(
				JSON.stringify({
					type: AUDIO_CALL_REJECTED,
					payload: {
						rejectedBy: {
							id: senderUser.userId,
							image: senderUser.getImage(),
							name: senderUser.name,
						},
					},
				}),
				senderUser.userId
			);
			chatManager.deleteChat(chat.chatId);
			//TODO: REMOVE IN MEDIA SOUP
			break;
		}

		case REQUEST_VIDEO_CALL: {
			const chat = chatManager.getChat(payload.chatId);
			if (senderUser && chat) {
				chat.addParticipantInCall(senderUser);
				chat.broadcastMessage(
					JSON.stringify({
						type: INCOMING_VIDEO_CALL,
						payload: {
							sender: {
								id: senderUser.getUserId(),
								image: senderUser.getImage(),
								name: senderUser.name,
							},
							chatId: chat.chatId,
						},
					}),
					senderUser.userId
				);
			} else {
				const requestedUser = userManager.getUser(payload.requestTo);

				if (!requestedUser) return;
				const newChat = chatManager.createChat(payload.chatId, senderUser);
				newChat.addParticipantInCall(senderUser);
				newChat.addParticipant(requestedUser);

				requestedUser.getSocket().send(
					JSON.stringify({
						type: REQUEST_VIDEO_CALL,
						payload: {
							sender: {
								id: senderUser.getUserId(),
								image: senderUser.getImage(),
								name: senderUser.name,
								interests: senderUser.interests,
							},
							chatId: newChat.chatId,
						},
					})
				);
			}

			await socketPubClient.publish(
				"mediasoup:getRouterRtpCapabilities",
				JSON.stringify({
					chatId: payload.chatId,
					userId: senderUser.userId,
				})
			);
			break;
		}

		case ACCEPT_VIDEO_CALL: {
			const chat = chatManager.getChat(payload.chatId);
			if (!chat || !senderUser) return;
			chat.addParticipantInCall(senderUser);
			chat.broadcastInCall(
				JSON.stringify({
					type: VIDEO_CALL_ACCEPTED,
					payload: {
						chatId: chat.chatId,
						acceptedBy: {
							id: senderUser.getUserId(),
							image: senderUser.getImage(),
							name: senderUser.name,
						},
					},
				}),
				senderUser.userId
			);

			await socketPubClient.publish(
				"mediasoup:getRouterRtpCapabilities",
				JSON.stringify({
					chatId: chat.chatId,
					userId: senderUser.userId,
				})
			);
			break;
		}
		case REJECT_INCOMING_VIDEO_CALL: {
			const chat = chatManager.getChat(payload.chatId);
			if (!chat) return;
			chat.removeParticipantFromCall(senderUser);

			chat.broadcastMessage(
				JSON.stringify({
					type: VIDEO_CALL_REJECTED,
					payload: {
						rejectedBy: {
							id: senderUser.userId,
							image: senderUser.getImage(),
							name: senderUser.name,
						},
					},
				}),
				senderUser.userId
			);
			//TODO: REMOVE IN MEDIA SOUP
			break;
		}
		case REJECT_VIDEO_CALL:
			{
				const chat = chatManager.getChat(payload.chatId);
				if (!chat) return;

				//TODO: FOR NOW, NOT SURE WHAT TO DO

				chat.broadcastMessage(
					JSON.stringify({
						type: VIDEO_CALL_REJECTED,
						payload: {
							rejectedBy: {
								id: senderUser.userId,
								image: senderUser.getImage(),
								name: senderUser.name,
							},
						},
					}),
					senderUser.userId
				);
				chatManager.deleteChat(chat.chatId);
				//TODO: REMOVE IN MEDIA SOUP
			}
			break;
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
						transportId: payload.transportId,
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
						rtpCapabilities: payload.rtpCapabilities,
						transportId: payload.transportId,
						producerId: payload.producerId,
						producerUserId: payload.consumerUserId,
					})
				);
			}
			break;
		}
		case RESUME_TRANSPORT: {
			const chat = chatManager.getChat(payload.chatId);
			console.log("yeta chat aayo hola hoina");
			if (chat) {
				await socketPubClient.publish(
					"mediasoup:resume",
					JSON.stringify({
						producerUserId: payload.producerUserId,
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
