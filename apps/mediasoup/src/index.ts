import type { types } from "mediasoup";
import { createWorker } from "./worker";
import type { Router } from "mediasoup/types";
import { Redis } from "redis-config";

const mediaPub = new Redis();
const mediaSub = new Redis();

let router: Router;

(async () => {
	router = await createWorker();
	console.log("Mediasoup worker and router initialized");
})();

type Peer = {
	transports: Map<string, types.WebRtcTransport>;
	producers: Map<string, types.Producer>;
	consumers: Map<string, types.Consumer>;
};

const rooms = new Map<
	string,
	{ router: types.Router; peers: Map<string, Peer> }
>();

mediaSub.subscribe("mediasoup:getRouterRtpCapabilities", async (message) => {});

mediaSub.subscribe("mediasoup:createProducerTransport", async (message) => {});

mediaSub.subscribe("mediasoup:connectProducerTransport", async (message) => {});
mediaSub.subscribe("mediasoup:produce", async (message) => {});

mediaSub.subscribe("mediasoup:createConsumerTransport", async (message) => {});
mediaSub.subscribe("mediasoup:connectConsumerTransport", async (message) => {});
mediaSub.subscribe("mediasoup:consume", async (message) => {});

mediaSub.subscribe("mediasoup:resume", async (message) => {});
