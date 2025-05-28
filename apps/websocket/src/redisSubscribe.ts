import { createClient } from "redis-config";
import { userManager } from "./user";
import { chatManager } from "./chat";

const socketSubClient = createClient();

(async () => {
	await socketSubClient
		.on("error", (err) => {
			console.error("Failed to connect socket subscribe conneciton", err);
		})
		.connect();
})();

socketSubClient.subscribe("mediasoup:rtpCapabilities", (message) => {
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
					payload: { ...parsedData.params, chatId: parsedData.chatId },
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
				type: "",
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
		chat.broadcastMessage(
			JSON.stringify({
				type: "produced_media",
				payload: {
					//TODO: MIGHT NEED TO SEND USER WHOLE DATA
					// CONSIDER IT AGAIN,
					user: {
						id: socketUser.userId,
						image: socketUser.getImage(),
						username: socketUser.username,
					},
					chatId: chat.chatId,
					producerId: parsedData.producerId,
				},
			}),
			socketUser.userId
		);
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
