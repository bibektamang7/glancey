import type {
	RtpCodecCapability,
	TransportListenInfo,
	WorkerLogLevel,
	WorkerLogTag,
} from "mediasoup/types";
import os from "os";

export const config = {
	listenIp: "0.0.0.0",
	listenPort: 3016,
	mediasoup: {
		numWorkers: Object.keys(os.cpus()).length,
		worker: {
			logLevel: "debug" as WorkerLogLevel,
			logTags: ["info", "ice", "dtls", "rtp", "srtp", "rtcp"] as WorkerLogTag[],
		},
		router: {
			mediaCodes: [
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
						"x-google-start-bitrate": 1000,
					},
				},
			] as RtpCodecCapability[],
		},
		// Webrtctransport setting
		webRtcTransport: {
			listenIps: [
				{ ip: "0.0.0.0", announcedIp: "127.0.0.1" },
			] as TransportListenInfo[],
			maxIncomeBitrate: 1500000,
			initialAvailableOutgoingBitrate: 1000000,
		},
	},
};
export const webRtcTransportOptions = {
	listenIps: [{ ip: "0.0.0.0", announcedIp: null }],
	enableUdp: true,
	enableTcp: true,
	preferUdp: true,
};
