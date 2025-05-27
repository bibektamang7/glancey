import { createClient } from "redis-config";
import { userManager } from "./user";

const socketSubClient = createClient();

(async () => {
	await socketSubClient.on("error", (err) => {}).connect();
})();

socketSubClient.subscribe("mediasoup:rtpCapabilities", (message) => {
	const messageFromMediaSoup = JSON.parse(message);
	const senderUser = userManager.getUser(messageFromMediaSoup.userId);
	if (senderUser) {
		senderUser.getSocket().send(
			JSON.stringify({
				type: "",
				payload: {
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
					type: "",
					payload: { ...parsedData.params },
				})
			);
		}
	}
);
