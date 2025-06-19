import type { Router, Worker } from "mediasoup/types";
import * as mediasoup from "mediasoup";
import { config } from "./mediasoup_config";

const worker: Array<{
	worker: Worker;
	router: Router;
}> = [];

let nextMediasoupWorkerIdx = 0;

const withTimeout = <T>(promise: Promise<T>, timeoutMs = 20000): Promise<T> =>
	Promise.race([
		promise,
		new Promise<T>((_, reject) =>
			setTimeout(
				() => reject(new Error("Timeout while creating router")),
				timeoutMs
			)
		),
	]);

const createWorker = async () => {
	const worker = await mediasoup.createWorker({
		logLevel: "debug",
		logTags: ["info", "ice", "dtls", "rtcp", "rtp", "srtp"],
	});

	worker.on("died", () => {
		console.log("wy not here");
		console.error(
			"Mediasoup worker died, exiting in 2 seconds... [pid:&d]",
			worker.pid
		);
		setTimeout(() => {
			process.exit(1);
		}, 2000);
	});
	worker.on("@failure", (fail) => {
		console.log("are we inside failure");
		console.error("mediasoup worker failed", fail.message);
		process.exit(1);
	});

	// const mediaCodecs = config.mediasoup.router.mediaCodecs;
	console.log("are we here");

	console.log("this is wokrer p id", worker.pid);
	console.log("is worker close", worker.closed);
	// await withTimeout(
	// 	worker.createRouter({
	// 		mediaCodecs: [
	// 			{
	// 				kind: "audio",
	// 				mimeType: "audio/opus",
	// 				clockRate: 48000,
	// 				channels: 2,
	// 			},
	// 			// {
	// 			// 	kind: "video",
	// 			// 	mimeType: "video/VP8",
	// 			// 	clockRate: 90000,
	// 			// 	parameters: {
	// 			// 		"x-google-start-bitrate": 300,
	// 			// 	},
	// 			// },
	// 		],
	// 	})
	// );
	const router = await worker.createRouter({
		mediaCodecs: [
			{
				kind: "audio",
				mimeType: "audio/opus",
				clockRate: 48000,
				channels: 2,
			},
			{
				kind: "video",
				mimeType: "video/VP8",
				clockRate: 90000,
				parameters: {
					"x-google-start-bitrate": 300,
				},
			},
		],
	});
	console.log("this is router", router.id);

	return router;
};

export { createWorker };
