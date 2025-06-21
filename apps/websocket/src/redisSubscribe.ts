import { createClient } from "redis-config";
import { userManager } from "./user";
import { chatManager } from "./chat";

const socketSubClient = createClient();

(async () => {
	await socketSubClient
		.on("error", (err) => {
			console.error("Failed to connect socket subscribe conneciton", err);
		})
		.connect()
		.then(() => {
			console.log("Redis subscriber connected");
		});
})();

socketSubClient.subscribe("mediasoup:rtpCapabilities", (message) => {
	console.log("here it comes for capabilites");
	const messageFromMediaSoup = JSON.parse(message);
	const senderUser = userManager.getUser(messageFromMediaSoup.userId);
	if (senderUser) {
		senderUser.getSocket().send(
			JSON.stringify({
				type: "rtpCapabilities",
				payload: {
					chatId: messageFromMediaSoup.chatId,
					rtpCapabilities: messageFromMediaSoup.routerCapabilities,
				},
			})
		);
	}
});

socketSubClient.subscribe(
	"mediasoup:ProducerTransportCreated",
	async (message) => {
		const parsedData = JSON.parse(message);
		const senderUser = userManager.getUser(parsedData.userId);
		if (senderUser) {
			senderUser.getSocket().send(
				JSON.stringify({
					type: "producer_transport_created",
					payload: {
						transport: {
							...parsedData.params,
						},
						chatId: parsedData.chatId,
					},
				})
			);
		}
	}
);

socketSubClient.subscribe("mediasoup:producerConnected", async (message) => {
	const parsedData = JSON.parse(message);
	const socketUser = userManager.getUser(parsedData.userId);
	if (socketUser) {
		socketUser.getSocket().send(
			JSON.stringify({
				type: "producer_connected",
				payload: {
					message: parsedData.message,
					chatId: parsedData.chatId,
				},
			})
		);
	}
});

socketSubClient.subscribe("mediasoup:produced", async (message) => {
	const parsedData = JSON.parse(message);
	const socketUser = userManager.getUser(parsedData.userId);
	const chat = chatManager.getChat(parsedData.chatId);

	if (socketUser && chat) {
		chat.broadcastInCall(
			JSON.stringify({
				type: "newProducer",
				payload: {
					chatId: chat.chatId,
					producerId: parsedData.producerId,
					userId: socketUser.userId,
					senderUserId: socketUser.userId,
				},
			}),
			socketUser.userId
		);
		socketUser.getSocket().send(
			JSON.stringify({
				type: "produced_media",
				payload: {
					chatId: chat.chatId,
					producerId: parsedData.producerId,
					userId: socketUser.userId,
				},
			})
		);
		const existingProducers = chat
			.getProducers()
			.filter((p) => p.userId !== socketUser.userId);

		for (const producer of existingProducers) {
			socketUser.getSocket().send(
				JSON.stringify({
					type: "newProducer",
					payload: {
						chatId: chat.chatId,
						producerId: producer.producerId,
						userId: producer.userId,
						senderUserId: producer.userId,
					},
				})
			);
		}
		chat.addProducer({
			userId: socketUser.userId,
			producerId: parsedData.producerId,
		});
	}
});

socketSubClient.subscribe(
	"mediasoup:subTransportedCreated",
	async (message) => {
		const parsedData = JSON.parse(message);
		const socketUser = userManager.getUser(parsedData.userId);

		if (socketUser) {
			socketUser.getSocket().send(
				JSON.stringify({
					type: "consumer_transport_created",
					payload: {
						params: parsedData.params,
						chatId: parsedData.chatId,
					},
				})
			);
		}
	}
);

socketSubClient.subscribe("mediasoup:subConnected", async (message) => {
	const parsedData = JSON.parse(message);
	const socketUser = userManager.getUser(parsedData.userId);

	if (socketUser) {
		socketUser.getSocket().send(
			JSON.stringify({
				type: "consumer_transport_connected",
				payload: {
					message: parsedData.message,
					chatId: parsedData.chatId,
				},
			})
		);
	}
});

socketSubClient.subscribe("mediasoup:subscribed", async (message) => {
	const parsedData = JSON.parse(message);
	const socketUser = userManager.getUser(parsedData.userId);

	if (socketUser) {
		socketUser.getSocket().send(
			JSON.stringify({
				type: "subscribed",
				payload: {
					remoteUserId: parsedData.remoteUserId,
					params: parsedData.params,
					chatId: parsedData.chatId,
				},
			})
		);
	}
});

socketSubClient.subscribe("mediasoup:resumed", async (message) => {
	const parsedData = JSON.parse(message);
	const socketUser = userManager.getUser(parsedData.userId);

	if (socketUser) {
		socketUser.getSocket().send(
			JSON.stringify({
				type: "resumed",
				payload: {
					message: parsedData.message,
				},
			})
		);
	}
});

socketSubClient.subscribe("mediasoup:error", async (message) => {
	const parsedData = JSON.parse(message);
	const socketUser = userManager.getUser(parsedData.userId);

	if (socketUser) {
		socketUser.getSocket().send(
			JSON.stringify({
				type: "error_on_media",
				payload: {
					message: parsedData.message,
				},
			})
		);
	}
});
