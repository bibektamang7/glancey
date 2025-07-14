import type { Router, Worker } from "mediasoup/types";
import * as mediasoup from "mediasoup";
import { config } from "./mediasoup_config";

const workers: Worker[] = [];

const createWorkers = async (count: number) => {
	for (let i = 0; i < count; i++) {
		const worker = await mediasoup.createWorker({
			logLevel: "debug",
			logTags: ["info", "ice", "dtls", "rtcp", "rtp", "srtp"],
			rtcMinPort: 10000,
			rtcMaxPort: 10100,
		});

		worker.on("died", () => {
			console.error(
				"Mediasoup worker died, exiting in 2 seconds... [pid:&d]",
				worker.pid
			);
			setTimeout(() => {
				process.exit(1);
			}, 2000);
		});
		worker.on("@failure", (fail) => {
			console.error("mediasoup worker failed", fail.message);
			process.exit(1);
		});
		workers.push(worker);
		console.log(`Created mediasoup worker ${i + 1} with PID ${worker.pid}`);
	}
};
let nextWorkerIndex = 0;

const getNextWorker = () => {
	if (workers.length === 0) {
		throw new Error("No workers available");
	}
	const worker = workers[nextWorkerIndex];
	nextWorkerIndex = (nextWorkerIndex + 1) % workers.length;
	return worker;
};

const createRouter = async () => {
	try {
		const worker = getNextWorker();

		if (!worker) {
			throw new Error("No available worker to create router");
		}
		worker.observer.on("close", () => {
			console.log(`Worker ${worker.pid} closed`);
			workers.splice(workers.indexOf(worker), 1);
		});

		const mediaCodecs = config.mediasoup.router.mediaCodecs;
		const router = await worker.createRouter({
			mediaCodecs: mediaCodecs,
		});

		router.observer.on("close", () => {
			console.log(`this router is closed ${router.id}`);
		});
		return router;
	} catch (error: any) {
		throw new Error("Failed to create router:", error.message);
	}
};

export { createRouter, createWorkers };
