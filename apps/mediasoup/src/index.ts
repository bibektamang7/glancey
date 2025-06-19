import { createWorker } from "./worker";
import { createClient } from "redis-config";
import { Room } from "./room";
import { createWebRtcTransport } from "./createWebrtcTransport";
import { createConsumer } from "./createConsumer";
import { Peer } from "./peer";

const mediaPub = createClient();
const mediaSub = createClient();

(async () => {
	await mediaPub
		.on("error", (err) => {
			console.error("Failed to connect to mediasoup publish", err);
		})
		.connect()
		.then(() => {
			console.log("Media publish is connected");
		});
	await mediaSub
		.on("error", (err) => {
			console.error("Failed to connect to mediasoup subscribe");
		})
		.connect()
		.then(() => {
			console.log("Media subscribe is connected");
		});
})();

const rooms = new Map<string, Room>();

const mediasoupError = async (message: string, userId: string) => {
	await mediaPub.publish(
		"mediasoup:error",
		JSON.stringify({
			userId,
			message,
		})
	);
};

const getOrCreateRoom = async (roomId: string) => {
	if (rooms.has(roomId)) {
		return rooms.get(roomId);
	}
	console.log("this is while creat ing room");
	try {
		const router = await createWorker();
		console.log("after creating router here");
		const room = new Room(roomId, router);
		rooms.set(roomId, room);

		return room;
	} catch (error) {
		console.log("k vao hosujfslkaf ");
	}
};

mediaSub.subscribe("mediasoup:getRouterRtpCapabilities", async (message) => {
	const parsedData = JSON.parse(message);
	//TODO: track the chat here so that when subscribe in websocket we can extract the chat

	try {
		const peer = new Peer(parsedData.userId);
		console.log("this is peer", peer.id);
		const room = await getOrCreateRoom(parsedData.chatId);
		console.log("is here room", room?.id);
		if (!room) {
			await mediasoupError("Failed to create room", parsedData.userId);
			return;
		}
		room.addPeer(peer);

		console.log("published the rtp");
		await mediaPub.publish(
			"mediasoup:rtpCapabilities",
			JSON.stringify({
				chatId: room.id,
				userId: parsedData.userId,
				routerCapabilities: room.router.rtpCapabilities,
			})
		);
	} catch (error) {
		console.log("Does something went wrong", error);
	}
});

mediaSub.subscribe("mediasoup:createProducerTransport", async (message) => {
	const parsedData = JSON.parse(message);
	try {
		const room = rooms.get(parsedData.chatId);
		if (!room) {
			await mediasoupError("unable to find room!!!", parsedData.userId);
			return;
		}
		const router = room.router;
		const { transport, params } = await createWebRtcTransport(router);
		const peer = room.getPeer(parsedData.userId);
		// Add producer transport in peer
		peer?.addTransport(transport);

		await mediaPub.publish(
			"mediasoup:ProducerTransportCreated",
			JSON.stringify({ params, userId: parsedData.userId, chatId: room.id })
		);
	} catch (error) {
		await mediasoupError(
			"Failed to create producer transport!!!",
			parsedData.userId
		);
		console.error("failed to create producer transport", error);
	}
});

mediaSub.subscribe("mediasoup:connectProducerTransport", async (message) => {
	const parsedData = JSON.parse(message);
	try {
		const room = rooms.get(parsedData.chatId);
		if (!room) {
			console.log("unable to find room in connect rpoducr transport");
			await mediasoupError("unable to find room!!!", parsedData.userId);
			return;
		}
		const peer = room.getPeer(parsedData.userId);
		const producerTransport = peer?.getTransport(parsedData.transportId);
		if (!producerTransport) {
			console.log("unable to find transport in connect producer transport");
			await mediasoupError("unable to transport!!!", parsedData.userId);
			return;
		}

		await producerTransport.connect({
			dtlParameters: parsedData.dtlsParameters,
		});

		await mediaPub.publish(
			"mediasoup:producerConnected",
			JSON.stringify({
				chatId: room.id,
				userId: parsedData.userId,
				message: "producer connected!",
			})
		);
	} catch (error) {
		await mediasoupError(
			"Failed to connect producer transport",
			parsedData.userId
		);
		console.error("failed to connect producer transport", error);
	}
});

mediaSub.subscribe("mediasoup:produce", async (message) => {
	const parsedData = JSON.parse(message);
	const { kind, rtpParameters, chatId, userId, transportId } = parsedData;
	const room = rooms.get(chatId);
	if (!room) {
		await mediasoupError("unable to find room", userId);
		return;
	}
	const peer = room.getPeer(userId);
	if (!peer) {
		await mediasoupError("unable to find peer", userId);
		return;
	}
	const producerTransport = peer.getTransport(transportId);
	if (!producerTransport) {
		await mediasoupError("unable to find transport", userId);
		return;
	}
	const producer = await producerTransport.produce({ kind, rtpParameters });
	peer.addProducer(producer);

	await mediaPub.publish(
		"mediasoup:produced",
		JSON.stringify({
			chatId: parsedData.chatId,
			userId: parsedData.userId,
			producerId: producer.id,
		})
	);
});

mediaSub.subscribe("mediasoup:createConsumerTransport", async (message) => {
	const parsedData = JSON.parse(message);
	const { chatId, userId } = parsedData;
	try {
		const room = rooms.get(chatId);
		if (!room) {
			await mediasoupError("unable to find room", userId);
			return;
		}
		const peer = room.getPeer(userId);
		if (!peer) {
			await mediasoupError("unable to find peer", userId);
			return;
		}
		const router = room.router;
		const { transport, params } = await createWebRtcTransport(router);
		// Add consumer transport in peer
		peer.addTransport(transport);
		await mediaPub.publish(
			"mediasoup:subTransportedCreated",
			JSON.stringify({ params, userId: parsedData.userId, chatId: room.id })
		);
	} catch (error) {
		await mediasoupError("Failed to create consumer transport", userId);
		console.error("failed to create consumer transport", error);
	}
});
mediaSub.subscribe("mediasoup:connectConsumerTransport", async (message) => {
	const parsedData = JSON.parse(message);
	const { chatId, userId, transportId } = parsedData;
	try {
		const room = rooms.get(chatId);
		if (!room) {
			await mediasoupError("unable to find room", userId);
			return;
		}
		const peer = room.getPeer(userId);
		if (!peer) {
			await mediasoupError("unable to find peer", userId);
			return;
		}
		const consumerTransport = peer.getTransport(transportId);
		if (!consumerTransport) {
			await mediasoupError("unable to find transport", userId);
			return;
		}
		await consumerTransport.connect({ dtlsParameters: parsedData.params });
		await mediaPub.publish(
			"mediasoup:subConnected",
			JSON.stringify({
				message: "consumer transport connected",
				userId: parsedData.userId,
				chatId: room.id,
			})
		);
		// send(ws, 'subConnected', "consumer transport connected")
	} catch (error) {
		await mediasoupError("Failed to connect consumer transport", userId);
		console.error("failed to connect consumer transport", error);
	}
});
mediaSub.subscribe("mediasoup:consume", async (message) => {
	const parsedData = JSON.parse(message);
	const { chatId, userId, transportId, producerId } = parsedData;
	try {
		const room = rooms.get(chatId);
		if (!room) {
			await mediasoupError("unable to find room", userId);
			return;
		}
		const peer = room.getPeer(userId);
		if (!peer) {
			await mediasoupError("unable to find peer", userId);
			return;
		}
		const producer = peer.getProducer(producerId);
		if (!producer) {
			await mediasoupError("unable to find producer", userId);
			return;
		}
		const consumerTransport = peer.getTransport(transportId);
		if (!consumerTransport) {
			await mediasoupError("unable to find transport", userId);
			return;
		}

		const router = room.router;
		// When a new user is added, consumer is created to consume their stream
		// i.e producer is user produced stream
		// Create consumer
		const consumerRes = await createConsumer(
			router,
			producer,
			parsedData.rtpCapabilities,
			consumerTransport
		);
		if (consumerRes) {
			peer.addConsumer(consumerRes);
			// consumer = consumerRes;
			const params = {
				producerId: producer.id,
				id: consumerRes.id,
				kind: consumerRes.kind,
				rtpCapabilities: consumerRes.rtpParameters,
				type: consumerRes.type,
				producerPaused: consumerRes.producerPaused,
			};

			await mediaPub.publish(
				"mediasoup:subscribed",
				JSON.stringify({ params, userId: parsedData.userId, chatId: room.id })
			);
		}
	} catch (error) {
		await mediasoupError("Failed to consumed", userId);
		console.error("failed to consume", error);
	}
});

mediaSub.subscribe("mediasoup:resume", async (message) => {
	const parsedData = JSON.parse(message);
	const { chatId, userId, consumerId } = parsedData;

	const room = rooms.get(chatId);
	if (!room) {
		await mediasoupError("unable to find room", userId);
		return;
	}
	const peer = room.getPeer(userId);
	if (!peer) {
		await mediasoupError("unable to find peer", userId);
		return;
	}
	const consumer = peer.getConsumer(consumerId);
	if (!consumer) {
		await mediasoupError("Failed to resumed", userId);
		return;
	}
	await consumer.resume();
	await mediaPub.publish(
		"mediasoup:resumed",
		JSON.stringify({ message: "consumer resumed", userId: userId })
	);
});
