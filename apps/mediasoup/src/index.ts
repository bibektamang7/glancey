import type { types } from "mediasoup";
import { createWorker } from "./worker";
import type { Consumer, Producer, Router, Transport } from "mediasoup/types";
import { createClient } from "redis-config";
import type { Room } from "./room";
import { createWebRtcTransport } from "./createWebrtcTransport";
import { createConsumer } from "./createConsumer";
import type { RedisClientType } from "@redis/client";

const mediaPub = createClient();
const mediaSub = createClient();

(async () => {
	await mediaPub.on("error", (err) => {}).connect();
	await mediaSub.on("error", (err) => {}).connect();
})();

let router: Router;

(async () => {
	router = await createWorker();
	console.log("Mediasoup worker and router initialized");
})();

// type Peer = {
// 	transports: Map<string, types.WebRtcTransport>;
// 	producers: Map<string, types.Producer>;
// 	consumers: Map<string, types.Consumer>;
// };

const rooms = new Map<string, Room>();

// const rooms = new Map<
// 	string,
// 	{ router: types.Router; peers: Map<string, Peer> }
// >();

mediaSub.subscribe("mediasoup:getRouterRtpCapabilities", async (message) => {
	const messageFromSocket = JSON.parse(message);
	//TODO: track the chat here so that when subscribe in websocket we can extract the chat
	await mediaPub.publish(
		"mediasoup:rtpCapabilities",
		JSON.stringify({
			userId: messageFromSocket.userId,
			routerCapabilities: router.rtpCapabilities,
		})
	);
});

let producerTransport: Transport;
mediaSub.subscribe("mediasoup:createProducerTransport", async (message) => {
	const parsedData = JSON.parse(message);
	try {
		const { transport, params } = await createWebRtcTransport(router);
		producerTransport = transport;
		await mediaPub.publish(
			"mediasoup:ProducerTransportCreated",
			JSON.stringify({ params, userId: parsedData.userId })
		);
	} catch (error) {
		mediaPub.publish("error", JSON.stringify({}));
	}
});

mediaSub.subscribe("mediasoup:connectProducerTransport", async (message) => {
	//TODO: parsed dtlParams from message
	const parsedData = JSON.parse(message);
	try {
		await producerTransport.connect({
			dtlParameters: parsedData.dtlsParameters,
		});
		mediaPub.publish(
			"producerConnected",
			JSON.stringify({ message: "producer connected!" })
		);
	} catch (error) {}
});

let producer: Producer;
let msg: any;
mediaSub.subscribe("mediasoup:produce", async (message) => {
	const parsedData = JSON.parse(message);
	const { kind, rtpParameters } = parsedData;
	producer = await producerTransport.produce({ kind, rtpParameters });
	const res = {
		id: producer.id,
	};
	//TODO: THIS NEED TO BE BROADCAST TO ALL USER IN THE CHAT
	mediaPub.publish("produced", JSON.stringify(res));
	//broadcast(websocket, "newProducer", 'new user')
});

let consumerTransport: Transport;

mediaSub.subscribe("mediasoup:createConsumerTransport", async (message) => {
	try {
		const { transport, params } = await createWebRtcTransport(router);
		consumerTransport = transport;
		await mediaPub.publish(
			"mediasoup:subTransportedCreated",
			JSON.stringify({ params })
		);
		//send(ws, 'subTransportedCreated', params)
	} catch (error) {}
});
mediaSub.subscribe("mediasoup:connectConsumerTransport", async (message) => {
	const parsedData = JSON.parse(message);
	try {
		await consumerTransport.connect({ dtlsParameters: parsedData.params });
		await mediaPub.publish(
			"mediasoup:subConnected",
			JSON.stringify({ message: "consumer transport connected" })
		);
		// send(ws, 'subConnected', "consumer transport connected")
	} catch (error) {}
});
mediaSub.subscribe("mediasoup:consume", async (message) => {
	const parsedData = JSON.parse(message);
	try {
		const consumerRes = await createConsumer(
			router,
			producer,
			parsedData.rtpCapabilities,
			consumerTransport
		);
		if (consumerRes) {
			consumer = consumerRes;
			const params = {
				producerId: producer.id,
				id: consumer.id,
				kind: consumer.kind,
				rtpCapabilities: consumer.rtpParameters,
				type: consumer.type,
				producerPaused: consumer.producerPaused,
			};

			await mediaPub.publish(
				"mediasoup:subscribed",
				JSON.stringify({ params })
			);
			//send(ws, "subscribed", params)
		}
	} catch (error) {}
});

let consumer: Consumer;
mediaSub.subscribe("mediasoup:resume", async (message) => {
	await consumer.resume();
	await mediaPub.publish(
		"mediasoup:resumed",
		JSON.stringify({ message: "consumer resumed" })
	);
	//send(ws, 'resumed', 'consumer ... resumed')
});
