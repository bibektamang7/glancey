import type { Router } from "mediasoup/types";
import { config } from "./mediasoup_config";

const createWebRtcTransport = async (mediasoupRouter: Router) => {
	const { maxIncomeBitrate, initialAvailableOutgoingBitrate } =
		config.mediasoup.webRtcTransport;

	const transport = await mediasoupRouter.createWebRtcTransport({
		listenIps: config.mediasoup.webRtcTransport.listenIps,
		// enableSctp: true,
		enableTcp: true,
		enableUdp: true,
		preferUdp: true,
		initialAvailableOutgoingBitrate,
	});

	if (maxIncomeBitrate) {
		try {
			await transport.setMaxIncomingBitrate(maxIncomeBitrate);
		} catch (error) {
			console.error(error);
		}
	}

	return {
		transport,
		params: {
			id: transport.id,
			iceParameters: transport.iceParameters,
			iceCandidates: transport.iceCandidates,
			dtlsParameters: transport.dtlsParameters,
		},
	};
};

export { createWebRtcTransport };
