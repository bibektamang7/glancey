"use client";

import type React from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import { Device } from "mediasoup-client";
import type { Transport, Producer } from "mediasoup-client/types";
import { useSocket } from "@/contexts/SocketProvider";
// import type { CallType } from "@/app/page";
import { CALLTYPE } from "@/contexts/CallProvider";
import { User } from "@/types/user";
import { REQUEST_AUDIO_CALL } from "socket-events";
import { useSession } from "next-auth/react";

interface MediasoupClientHook {
	localVideoRef: React.RefObject<HTMLVideoElement | null>;
	remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
	isAudioEnabled: boolean;
	isVideoEnabled: boolean;
	isScreenSharing: boolean;
	joinRoom: (roomId: string, callType: CALLTYPE, user: User) => Promise<void>;
	leaveRoom: () => Promise<void>;
	toggleAudio: () => void;
	toggleVideo: () => void;
	toggleScreenShare: () => void;
}

export function useMediasoupClient(): MediasoupClientHook {
	const session = useSession();
	const [device, setDevice] = useState<Device | null>(null);
	const { socket } = useSocket();
	const [sendTransport, setSendTransport] = useState<Transport | null>(null);
	const [recvTransport, setRecvTransport] = useState<Transport | null>(null);
	const [audioProducer, setAudioProducer] = useState<Producer | null>(null);
	const [videoProducer, setVideoProducer] = useState<Producer | null>(null);
	const [screenProducer, setScreenProducer] = useState<Producer | null>(null);
	const [isAudioEnabled, setIsAudioEnabled] = useState(true);
	const [isVideoEnabled, setIsVideoEnabled] = useState(true);
	const [isScreenSharing, setIsScreenSharing] = useState(false);
	const [currentCallType, setCurrentCallType] = useState<CALLTYPE>("audio");

	const localVideoRef = useRef<HTMLVideoElement>(null);
	const remoteVideoRef = useRef<HTMLVideoElement>(null);
	const localStreamRef = useRef<MediaStream | null>(null);
	const screenStreamRef = useRef<MediaStream | null>(null);

	// Initialize device
	useEffect(() => {
		const initDevice = async () => {
			const newDevice = new Device();
			setDevice(newDevice);
		};
		initDevice();
	}, []);

	// WebSocket message handler
	const handleSocketMessage = useCallback(
		async (event: MessageEvent) => {
			const message = JSON.parse(event.data);
			const payload = message.payload;

			switch (message.type) {
				case "rtpCapabilities":
					if (device && !device.loaded) {
						await device.load({
							routerRtpCapabilities: payload.rtpCapabilities,
						});
					}
					break;

				case "producer_transport_created":
					//TODO: NOT
					await createSendTransport(payload.transport);
					break;

				case "consumer_transport_created":
					await createRecvTransport(payload.params);
					break;

				case "newConsumer":
					await createConsumer(message.data);
					break;

				case "producerClosed":
					handleProducerClosed(message.data);
					break;
			}
		},
		[device]
	);

	// Handle producer closed
	const handleProducerClosed = useCallback((data: { producerId: string }) => {
		// Handle when remote producer is closed
		console.log("Producer closed:", data.producerId);
	}, []);

	// Create send transport
	const createSendTransport = useCallback(
		async (transportOptions: any) => {
			if (!device) return;

			const transport = device.createSendTransport(transportOptions);

			transport.on("connect", async ({ dtlsParameters }, callback, errback) => {
				try {
					socket?.send(
						JSON.stringify({
							type: "connect_producer_transport",
							payload: {
								dtlsParameters,
							},
						})
					);
					callback();
				} catch (error: any) {
					errback(error);
				}
			});

			transport.on(
				"produce",
				async ({ kind, rtpParameters }, callback, errback) => {
					try {
						socket?.send(
							JSON.stringify({
								type: "produce",
								payload: {
									kind,
									rtpParameters,
									transportId: transport.id,
								},
							})
						);

						// Wait for producer ID from server
						const handleProducerCreated = (event: MessageEvent) => {
							const message = JSON.parse(event.data);
							//TODO: DO NO now !!!
							if (message.type === "produced_media") {
								callback({ id: message.payload.producerId });
								socket?.removeEventListener("message", handleProducerCreated);
							}
						};
						socket?.addEventListener("message", handleProducerCreated);
					} catch (error: any) {
						errback(error);
					}
				}
			);

			setSendTransport(transport);
			return transport;
		},
		[device, socket]
	);

	// Create receive transport
	const createRecvTransport = useCallback(
		async (transportOptions: any) => {
			if (!device) return;

			const transport = device.createRecvTransport(transportOptions);

			transport.on("connect", async ({ dtlsParameters }, callback, errback) => {
				try {
					socket?.send(
						JSON.stringify({
							type: "connect_consumer_transport",
							payload: {
								dtlsParameters,
							},
						})
					);
					callback();
				} catch (error: any) {
					errback(error);
				}
			});

			setRecvTransport(transport);
			return transport;
		},
		[device, socket]
	);

	// Create consumer
	const createConsumer = useCallback(
		async (consumerOptions: any) => {
			if (!recvTransport) return;

			const consumer = await recvTransport.consume(consumerOptions);

			if (remoteVideoRef.current) {
				const stream = new MediaStream([consumer.track]);
				remoteVideoRef.current.srcObject = stream;
			}

			socket?.send(
				JSON.stringify({
					type: "resume",
					payload: {
						consumerId: consumer.id,
					},
				})
			);
		},
		[recvTransport, socket]
	);

	// Get user media based on call type
	const getUserMedia = useCallback(async (callType: CALLTYPE) => {
		try {
			let constraints: MediaStreamConstraints = {};

			switch (callType) {
				case "audio":
					constraints = { audio: true, video: false };
					break;
				case "video":
					constraints = { audio: true, video: true };
					break;
				// case "screen":
				// 	constraints = { audio: true, video: false };
				// 	break;
			}

			const stream = await navigator.mediaDevices.getUserMedia(constraints);
			localStreamRef.current = stream;

			if (localVideoRef.current && callType === "video") {
				localVideoRef.current.srcObject = stream;
			}

			return stream;
		} catch (error) {
			console.error("Error accessing media devices:", error);
			throw error;
		}
	}, []);

	// Get screen share
	const getScreenShare = useCallback(async () => {
		try {
			const stream = await navigator.mediaDevices.getDisplayMedia({
				video: true,
				audio: true,
			});

			screenStreamRef.current = stream;

			// Handle screen share end
			if (stream) {
				const videoTracks = stream.getVideoTracks()[0];
				videoTracks?.addEventListener("ended", () => {
					setIsScreenSharing(false);
					if (screenProducer) {
						screenProducer.close();
						setScreenProducer(null);
					}
				});
			}

			return stream;
		} catch (error) {
			console.error("Error accessing screen share:", error);
			throw error;
		}
	}, [screenProducer]);

	// Join room
	const joinRoom = useCallback(
		async (roomId: string, callType: CALLTYPE, user: User) => {
			if (!socket) return;
			setCurrentCallType(callType);
			socket.send(
				JSON.stringify({
					type: REQUEST_AUDIO_CALL,
					payload: {
						chatId: roomId,
						sender: session.data?.user?.id,
						requestTo: user.id,
					},
				})
			);
			socket.addEventListener("message", handleSocketMessage);

			try {
				// Get user media based on call type
				await getUserMedia(callType);

				// For screen share calls, also get screen share
				// if (callType === "screen") {
				// 	await getScreenShare();
				// 	setIsScreenSharing(true);
				// }
			} catch (error) {
				throw error;
			}
		},
		[handleSocketMessage, getUserMedia, getScreenShare]
	);

	// Leave room
	const leaveRoom = useCallback(async () => {
		// Close producers
		audioProducer?.close();
		videoProducer?.close();
		screenProducer?.close();

		// Close transports
		sendTransport?.close();
		recvTransport?.close();

		// Close socket
		socket?.close();

		// Stop local streams
		localStreamRef.current?.getTracks().forEach((track) => track.stop());
		screenStreamRef.current?.getTracks().forEach((track) => track.stop());

		// Reset state
		setSendTransport(null);
		setRecvTransport(null);
		setAudioProducer(null);
		setVideoProducer(null);
		setScreenProducer(null);
		setIsScreenSharing(false);
	}, [
		audioProducer,
		videoProducer,
		screenProducer,
		sendTransport,
		recvTransport,
		socket,
	]);

	// Toggle audio
	const toggleAudio = useCallback(() => {
		if (audioProducer) {
			if (isAudioEnabled) {
				audioProducer.pause();
			} else {
				audioProducer.resume();
			}
		}

		// Also mute/unmute local stream
		localStreamRef.current?.getAudioTracks().forEach((track) => {
			track.enabled = !isAudioEnabled;
		});

		setIsAudioEnabled(!isAudioEnabled);
	}, [audioProducer, isAudioEnabled]);

	// Toggle video
	const toggleVideo = useCallback(() => {
		if (videoProducer) {
			if (isVideoEnabled) {
				videoProducer.pause();
			} else {
				videoProducer.resume();
			}
		}

		// Also enable/disable local stream
		localStreamRef.current?.getVideoTracks().forEach((track) => {
			track.enabled = !isVideoEnabled;
		});

		setIsVideoEnabled(!isVideoEnabled);
	}, [videoProducer, isVideoEnabled]);

	// Toggle screen share
	const toggleScreenShare = useCallback(async () => {
		try {
			if (isScreenSharing) {
				// Stop screen sharing
				if (screenProducer) {
					screenProducer.close();
					setScreenProducer(null);
				}
				screenStreamRef.current?.getTracks().forEach((track) => track.stop());
				setIsScreenSharing(false);
			} else {
				// Start screen sharing
				const screenStream = await getScreenShare();
				setIsScreenSharing(true);

				// If we have a send transport, create screen producer
				if (sendTransport && screenStream) {
					const videoTrack = screenStream.getVideoTracks()[0];
					if (videoTrack) {
						const producer = await sendTransport.produce({ track: videoTrack });
						setScreenProducer(producer);
					}
				}
			}
		} catch (error) {
			console.error("Error toggling screen share:", error);
			setIsScreenSharing(false);
		}
	}, [isScreenSharing, screenProducer, sendTransport, getScreenShare]);

	return {
		localVideoRef,
		remoteVideoRef,
		isAudioEnabled,
		isVideoEnabled,
		isScreenSharing,
		joinRoom,
		leaveRoom,
		toggleAudio,
		toggleVideo,
		toggleScreenShare,
	};
}
