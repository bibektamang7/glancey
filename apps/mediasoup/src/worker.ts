import type { MediaKind, Router, Worker } from "mediasoup/types";
import * as mediasoup from "mediasoup";
import { config } from "./mediasoup_config";

const worker: Array<{
	worker: Worker;
	router: Router;
}> = [];

let nextMediasoupWorkerIdx = 0;

const createWorker = async () => {
	const worker = await mediasoup.createWorker({
		logLevel: config.mediasoup.worker.logLevel,
		logTags: config.mediasoup.worker.logTags,
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

	const mediaCodecs = config.mediasoup.router.mediaCodes;
	return worker.createRouter({ mediaCodecs });
};

export { createWorker };
