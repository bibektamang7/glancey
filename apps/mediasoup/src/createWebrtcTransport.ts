import type { Router } from "mediasoup/types";
import { config } from "./mediasoup_config";

const createWebRtcTransport = async (mediasoupRouter: Router) => {
	const { maxIncomeBitrate, initialAvailableOutgoingBitrate } =
		config.mediasoup.webRtcTransport;

	const listenIps = [
		{
			ip: "0.0.0.0",
			announcedIp: "127.0.0.1",
		},
	];
	const transport = await mediasoupRouter.createWebRtcTransport({
		listenIps: listenIps,
		// listenInfos: [
		// 	{
		// 		ip: "0.0.0.0",
		// 		announcedIp: process.env.ANNOUNCED_IP || "127.0.0.1",
		// 		protocol: "udp",
		// 		portRange: { min: 40000, max: 49999 }, // Adjust this range as needed
		// 	},
		// 	{
		// 		ip: "0.0.0.0",
		// 		announcedIp: process.env.ANNOUNCED_IP || "127.0.0.1",
		// 		protocol: "tcp",
		// 		portRange: { min: 40000, max: 49999 }, // Adjust this range as needed
		// 	},
		// ],
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
