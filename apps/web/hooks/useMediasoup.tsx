"use client";

import React from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import { Device } from "mediasoup-client";
import type { Transport, Producer, Consumer } from "mediasoup-client/types";
import { useSocket } from "@/contexts/SocketProvider";
import { CALLTYPE, Room } from "@/contexts/CallProvider";
import {
	ACCEPT_AUDIO_CALL,
	ACCEPT_VIDEO_CALL,
	CONNECT_CONSUMER,
	CONNECT_PRODUCER,
	CONNECT_PRODUCER_TRANSPORT,
	CREATE_CONSUMER_TRANSPORT,
	CREATE_PRODUCER_TRANSPORT,
	REQUEST_AUDIO_CALL,
	REQUEST_VIDEO_CALL,
} from "socket-events";
import { useSession } from "next-auth/react";

interface ConsumerProps {
	id: string;
	producerId: string;
	kind: string;
	producerPaused: boolean;
	type: string;
	rtpCapabilities: any;
	appData?: any;
}

interface MediasoupClientHook {
	localVideoRef: React.RefObject<HTMLVideoElement | null>;
	remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
	remoteStream: MediaStream | null;
	isAudioEnabled: boolean;
	isVideoEnabled: boolean;
	isScreenSharing: boolean;
	joinRoom: (roomId: string, callType: CALLTYPE, user: string) => Promise<void>;
	leaveRoom: () => Promise<void>;
	toggleAudio: () => void;
	toggleVideo: () => void;
	toggleScreenShare: () => void;
	handleVideoCallAccepted: (chatId: string) => void;
	handleAudioCallAccepted: (chatId: string) => void;
	localStreamRef: React.RefObject<MediaStream | null>;
}

export function useMediasoupClient(
	room: Room,
	callType: CALLTYPE
): MediasoupClientHook {
	const session = useSession();
	const { socket } = useSocket();
	const sendTransportRef = useRef<Transport | null>(null);
	const recvTransportRef = useRef<Transport | null>(null);
	const [isConsumerTransportCreated, setIsConsumerTransportCreated] =
		useState(false);

	const [audioProducer, setAudioProducer] = useState<Producer | null>(null);
	const [videoProducer, setVideoProducer] = useState<Producer | null>(null);
	const [screenProducer, setScreenProducer] = useState<Producer | null>(null);
	const [audioConsumer, setAudioConsumer] = useState<Consumer | null>(null);
	const [videoConsumer, setVideoConsumer] = useState<Consumer | null>(null);
	const [screenConsumer, setScreenConsumer] = useState<Consumer | null>(null);

	const [isAudioEnabled, setIsAudioEnabled] = useState(true);
	const [isVideoEnabled, setIsVideoEnabled] = useState(true);
	const [isScreenSharing, setIsScreenSharing] = useState(false);

	const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

	const localVideoRef = useRef<HTMLVideoElement>(null);
	const remoteVideoRef = useRef<HTMLVideoElement>(null);
	const localStreamRef = useRef<MediaStream | null>(null);
	const screenStreamRef = useRef<MediaStream | null>(null);

	const deviceRef = useRef<Device | null>(null);
	const isInitializingRef = useRef(false);

	const createConsumerTransport = useCallback(async () => {
		if (isConsumerTransportCreated || recvTransportRef.current) {
			console.log("Consumer transport already exists");
			return;
		}

		if (socket) {
			socket.send(
				JSON.stringify({
					type: CREATE_CONSUMER_TRANSPORT,
					payload: {
						sender: session.data?.user?.id,
						chatId: room.id,
					},
				})
			);
		}
	}, [socket, room.id]);

	const handleConsume = (producerId: string, consumerUserId: string) => {
		if (!recvTransportRef.current) return;

		socket?.send(
			JSON.stringify({
				type: CONNECT_CONSUMER,
				payload: {
					chatId: room.id,
					sender: session.data?.user?.id,
					rtpCapabilities: deviceRef.current?.rtpCapabilities,
					producerId: producerId,
					transportId: recvTransportRef.current.id,
					consumerUserId,
				},
			})
		);
	};

	const handleSocketMessage = useCallback(
		async (event: MessageEvent) => {
			const eventMessage = JSON.parse(event.data);
			const payload = eventMessage.payload;

			switch (eventMessage.type) {
				case "rtpCapabilities":
					if (deviceRef.current && !deviceRef.current.loaded) {
						try {
							await deviceRef.current.load({
								routerRtpCapabilities: payload.rtpCapabilities,
							});
						} catch (error) {
							console.error("Failed to load device:", error);
							return;
						}
					}
					if (socket) {
						socket.send(
							JSON.stringify({
								type: CREATE_PRODUCER_TRANSPORT,
								payload: {
									chatId: room.id,
									sender: session.data?.user?.id,
									rtpCapabilities: payload.rtpCapabilities,
								},
							})
						);
					}
					break;

				case "producer_transport_created":
					if (payload.chatId === room.id) {
						const transport = await createSendTransport(payload.transport);
						if (transport) {
							await startProducing();
						}
					}
					break;

				case "subscribed":
					await createConsumer(payload.params, payload.remoteUserId);
					break;

				case "producerClosed":
					handleProducerClosed(payload);
					break;

				case "consumerClosed":
					handleConsumerClosed(payload);
					break;

				case "resumed":
					if (remoteStream && remoteVideoRef.current) {
						remoteVideoRef.current.srcObject = remoteStream;
						const onLoaded = () => {
							remoteVideoRef.current
								?.play()
								.then(() => console.log("Resumed media playback"))
								.catch((err) =>
									console.error("Failed to resume playback:", err)
								);
						};
						remoteVideoRef.current.addEventListener(
							"loadedmetadata",
							onLoaded,
							{ once: true }
						);
					}
					break;

				case "userLeft":
					handleUserLeft();
					break;

				case "newProducer":
					if (
						payload.userId !== session.data?.user?.id &&
						payload.chatId === room.id
					) {
						if (!recvTransportRef.current && socket) {
							await createConsumerTransport();

							const onConsumerTransportConnected = async (
								event: MessageEvent
							) => {
								const message = JSON.parse(event.data);

								if (message.payload.chatId !== room.id) return;
								if (message.type === "consumer_transport_connected") {
									socket.removeEventListener(
										"message",
										onConsumerTransportConnected
									);
								} else if (message.type === "consumer_transport_created") {
									const transport = await createRecvTransport(
										message.payload.params
									);
									if (transport) {
										handleConsume(payload.producerId, payload.senderUserId);
									}
								}
							};

							socket.addEventListener("message", onConsumerTransportConnected, {
								once: true,
							});
						} else {
							console.log(
								"thisis producer id in bro",
								payload.producerId,
								session.data?.user?.id
							);
							handleConsume(payload.producerId, payload.senderUserId);
						}
					}
					break;
			}
		},
		[room.id, session.data?.user?.id, socket]
	);

	const handleAudioCallAccepted = useCallback(
		async (chatId: string) => {
			try {
				const stream = await getUserMedia("audio");
				if (stream) {
					console.log("Audio stream obtained:", stream.getAudioTracks().length);
				}
			} catch (error) {
				console.error("Failed to get user media:", error);
				throw error;
			}
			if (socket) {
				socket.send(
					JSON.stringify({
						type: ACCEPT_AUDIO_CALL,
						payload: {
							sender: session.data?.user?.id,
							chatId,
						},
					})
				);
			}
		},
		[socket, session.data?.user?.id]
	);

	const handleVideoCallAccepted = useCallback(
		async (chatId: string) => {
			try {
				const stream = await getUserMedia("video");
				if (stream) {
					console.log("Video stream obtained:", stream.getVideoTracks().length);
				}
			} catch (error) {
				console.error("Failed to get user media:", error);
				throw error;
			}
			if (socket) {
				socket.send(
					JSON.stringify({
						type: ACCEPT_VIDEO_CALL,
						payload: {
							sender: session.data?.user?.id,
							chatId,
						},
					})
				);
			}
		},
		[socket, session.data?.user?.id]
	);

	const handleProducerClosed = useCallback(
		(data: { producerId: string; userId: string; kind?: string }) => {
			if (data.kind === "audio" && audioConsumer) {
				audioConsumer.close();
				setAudioConsumer(null);
			} else if (data.kind === "video" && videoConsumer) {
				videoConsumer.close();
				setVideoConsumer(null);
			} else if (screenConsumer) {
				screenConsumer.close();
				setScreenConsumer(null);
			}

			// Recreate remote stream without the closed track
			const newStream = new MediaStream();
			if (audioConsumer && data.kind !== "audio") {
				newStream.addTrack(audioConsumer.track);
			}
			if (videoConsumer && data.kind !== "video") {
				newStream.addTrack(videoConsumer.track);
			}
			if (screenConsumer && !data.kind) {
				newStream.addTrack(screenConsumer.track);
			}

			setRemoteStream(newStream);
			if (remoteVideoRef.current) {
				remoteVideoRef.current.srcObject = newStream;
			}
		},
		[audioConsumer, videoConsumer, screenConsumer]
	);

	const handleConsumerClosed = useCallback(
		(data: { consumerId: string; userId: string }) => {
			if (audioConsumer?.id === data.consumerId) {
				audioConsumer.close();
				setAudioConsumer(null);
			} else if (videoConsumer?.id === data.consumerId) {
				videoConsumer.close();
				setVideoConsumer(null);
			} else if (screenConsumer?.id === data.consumerId) {
				screenConsumer.close();
				setScreenConsumer(null);
			}
		},
		[audioConsumer, videoConsumer, screenConsumer]
	);

	const handleUserLeft = useCallback(() => {
		// Close all consumers
		audioConsumer?.close();
		videoConsumer?.close();
		screenConsumer?.close();

		// Stop remote stream tracks
		if (remoteStream) {
			remoteStream.getTracks().forEach((track) => track.stop());
		}

		// Reset states
		setAudioConsumer(null);
		setVideoConsumer(null);
		setScreenConsumer(null);
		setRemoteStream(null);

		// Clear remote video element
		if (remoteVideoRef.current) {
			remoteVideoRef.current.srcObject = null;
		}
	}, [audioConsumer, videoConsumer, screenConsumer, remoteStream]);

	const createSendTransport = useCallback(
		async (transportOptions: any) => {
			if (!deviceRef.current) {
				console.error("Device not available for createSendTransport");
				return null;
			}
			try {
				const transport = deviceRef.current.createSendTransport({
					...transportOptions,
					iceServers: [
						{
							urls: "stun:stun.l.google.com:19302",
						},
					],
					iceTransportPolicy: "all",
				});

				transport.on(
					"connect",
					async ({ dtlsParameters }, callback, errback) => {
						try {
							socket?.send(
								JSON.stringify({
									type: CONNECT_PRODUCER_TRANSPORT,
									payload: {
										dtlsParameters,
										chatId: room.id,
										sender: session.data?.user?.id,
										transportId: transport.id,
									},
								})
							);
							callback();
						} catch (error: any) {
							errback(error);
						}
					}
				);

				transport.on(
					"produce",
					async ({ kind, rtpParameters, appData }, callback, errback) => {
						try {
							const handleProducerCreated = (event: MessageEvent) => {
								const message = JSON.parse(event.data);

								if (message.type === "produced_media") {
									// if (message.payload.userId !== session.data?.user?.id) {
									// 	if (!recvTransportRef.current) {
									// 		createConsumerTransport();
									// 	}
									// 	return;
									// }

									callback({ id: message.payload.producerId });
									socket?.removeEventListener("message", handleProducerCreated);
								}
							};
							socket?.addEventListener("message", handleProducerCreated);

							socket?.send(
								JSON.stringify({
									type: CONNECT_PRODUCER,
									payload: {
										kind,
										rtpParameters,
										transportId: transport.id,
										chatId: room.id,
										appData,
										sender: session.data?.user?.id,
									},
								})
							);
						} catch (error: any) {
							errback(error);
						}
					}
				);

				sendTransportRef.current = transport;
				return transport;
			} catch (error) {
				console.error("Failed to create send transport:", error);
				return null;
			}
		},
		[socket, room.id]
	);

	const createRecvTransport = useCallback(
		async (transportOptions: any) => {
			if (!deviceRef.current) {
				console.error("Device not available for createRecvTransport");
				return null;
			}

			if (recvTransportRef.current) {
				console.log("Consumer transport already exists");
				return recvTransportRef.current;
			}

			try {
				const transport =
					deviceRef.current.createRecvTransport(transportOptions);

				transport.on(
					"connect",
					async ({ dtlsParameters }, callback, errback) => {
						try {
							socket?.send(
								JSON.stringify({
									type: "connect_consumer_transport",
									payload: {
										sender: session.data?.user?.id,
										dtlsParameters,
										chatId: room.id,
										transportId: transport.id,
									},
								})
							);
							callback();
						} catch (error: any) {
							errback(error);
						}
					}
				);

				recvTransportRef.current = transport;
				setIsConsumerTransportCreated(true);

				return transport;
			} catch (error) {
				console.error("Failed to create receive transport:", error);
				return null;
			}
		},
		[socket, room.id, session.data?.user?.id]
	);

	const createConsumer = useCallback(
		async (
			{
				id,
				kind,
				producerId,
				producerPaused,
				rtpCapabilities,
				type,
				appData,
			}: ConsumerProps,
			userId: string
		) => {
			const recvTransport = recvTransportRef.current;

			if (!recvTransport) {
				console.error("No receive transport available");
				await createConsumerTransport();
				return;
			}

			try {
				const consumer = await recvTransport.consume({
					id: id,
					producerId: producerId,
					kind: kind as "audio" | "video",
					rtpParameters: rtpCapabilities,
					appData: appData,
				});

				socket?.send(
					JSON.stringify({
						type: "resume",
						payload: {
							producerUserId: userId,
							sender: session.data?.user?.id,
							consumerId: consumer.id,
							chatId: room.id,
						},
					})
				);

				// Set consumer based on kind and appData
				if (kind === "audio") {
					setAudioConsumer(consumer);
				} else if (kind === "video") {
					if (appData?.mediaType === "screen") {
						setScreenConsumer(consumer);
					} else {
						setVideoConsumer(consumer);
					}
				}

				// Update remote stream
				setRemoteStream((prevStream) => {
					const newStream = prevStream ? prevStream.clone() : new MediaStream();
					newStream.addTrack(consumer.track);
					return newStream;
				});

				// Set video element source for video tracks
				if (kind === "video") {
					setTimeout(() => {
						if (remoteVideoRef.current && remoteStream) {
							remoteVideoRef.current.srcObject = remoteStream;
							const handleLoaded = () => {
								remoteVideoRef.current?.play().catch(console.error);
							};
							remoteVideoRef.current.addEventListener(
								"loadedmetadata",
								handleLoaded,
								{ once: true }
							);
						}
					}, 100);
				}
			} catch (error) {
				console.error("Failed to create consumer:", error);
			}
		},
		[socket, room.id, createConsumerTransport, remoteStream]
	);

	const startProducing = useCallback(async () => {
		if (!sendTransportRef.current || !localStreamRef.current) {
			console.error("Transport or stream not available for producing");
			return;
		}

		try {
			// Always produce audio
			const audioTracks = localStreamRef.current.getAudioTracks();
			console.log("Audio tracks available:", audioTracks.length);

			if (audioTracks.length > 0) {
				const audioProducer = await sendTransportRef.current.produce({
					track: audioTracks[0],
					appData: { mediaType: "audio" },
				});
				setAudioProducer(audioProducer);
			}

			// Produce video only for video calls
			if (callType === "video") {
				const videoTracks = localStreamRef.current.getVideoTracks();

				if (videoTracks.length > 0) {
					const videoProducer = await sendTransportRef.current.produce({
						track: videoTracks[0],
						appData: { mediaType: "video" },
					});
					setVideoProducer(videoProducer);
				}
			}
		} catch (error) {
			console.error("Failed to start producing:", error);
		}
	}, [callType]);
	async function getAvailableCamera(constraints = { width: 640, height: 480 }) {
		try {
			// First, try default camera
			const stream = await navigator.mediaDevices.getUserMedia({
				video: constraints,
				audio: true,
			});
			return stream;
		} catch (err) {
			console.warn("Default camera failed:", err);

			// Enumerate all video input devices
			const devices = await navigator.mediaDevices.enumerateDevices();
			const videoInputs = devices.filter((d) => d.kind === "videoinput");

			for (const device of videoInputs) {
				try {
					// Try to get stream from each deviceId explicitly
					const stream = await navigator.mediaDevices.getUserMedia({
						video: { deviceId: { exact: device.deviceId }, ...constraints },
						audio: true,
					});
					console.log("Using camera:", device.label);
					return stream;
				} catch (e) {
					console.warn(`Camera ${device.label} unavailable, trying next...`);
				}
			}

			throw new Error("No available camera found");
		}
	}

	const getUserMedia = useCallback(async (callType: CALLTYPE) => {
		try {
			let constraints: MediaStreamConstraints = {};

			switch (callType) {
				case "audio":
					constraints = { audio: true, video: false };
					break;
				case "video":
					constraints = {
						audio: true,
						video: {
							width: { ideal: 1280 },
							height: { ideal: 720 },
							frameRate: { ideal: 30 },
						},
					};
					break;
			}

			// const stream = await navigator.mediaDevices.getUserMedia(constraints);
			const stream = await getAvailableCamera();
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

	const getScreenShare = useCallback(async () => {
		try {
			const stream = await navigator.mediaDevices.getDisplayMedia({
				video: true,
				audio: true,
			});

			screenStreamRef.current = stream;

			// Handle screen share end
			const videoTrack = stream.getVideoTracks()[0];
			if (videoTrack) {
				videoTrack.addEventListener("ended", () => {
					console.log("Screen share ended by user");
					setIsScreenSharing(false);
					if (screenProducer) {
						screenProducer.close();
						setScreenProducer(null);
					}
					screenStreamRef.current?.getTracks().forEach((track) => track.stop());
					screenStreamRef.current = null;
				});
			}

			return stream;
		} catch (error) {
			console.error("Error accessing screen share:", error);
			throw error;
		}
	}, [screenProducer]);

	const joinRoom = useCallback(
		async (roomId: string, callType: CALLTYPE, callToId: string) => {
			if (!socket) {
				console.error("Socket not available");
				return;
			}
			try {
				const stream = await getUserMedia(callType);
				console.log("Successfully obtained media stream");
			} catch (error) {
				console.error("Failed to get user media:", error);
				throw error;
			}

			socket.send(
				JSON.stringify({
					type: callType === "audio" ? REQUEST_AUDIO_CALL : REQUEST_VIDEO_CALL,
					payload: {
						chatId: roomId,
						sender: session.data?.user?.id,
						requestTo: callToId,
					},
				})
			);
		},
		[socket, session.data?.user?.id, getUserMedia]
	);

	const leaveRoom = useCallback(async () => {
		console.log("Leaving room and cleaning up...");

		// Close all producers
		if (audioProducer) {
			audioProducer.close();
			setAudioProducer(null);
		}
		if (videoProducer) {
			videoProducer.close();
			setVideoProducer(null);
		}
		if (screenProducer) {
			screenProducer.close();
			setScreenProducer(null);
		}

		// Close all consumers
		if (audioConsumer) {
			audioConsumer.close();
			setAudioConsumer(null);
		}
		if (videoConsumer) {
			videoConsumer.close();
			setVideoConsumer(null);
		}
		if (screenConsumer) {
			screenConsumer.close();
			setScreenConsumer(null);
		}

		// Close transports
		if (sendTransportRef.current) {
			sendTransportRef.current.close();
			sendTransportRef.current = null;
		}
		if (recvTransportRef.current) {
			recvTransportRef.current.close();
			recvTransportRef.current = null;
		}

		// Stop all local media tracks
		if (localStreamRef.current) {
			localStreamRef.current.getTracks().forEach((track) => {
				track.stop();
				console.log("Stopped local track:", track.kind);
			});
			localStreamRef.current = null;
		}

		// Stop screen share tracks
		if (screenStreamRef.current) {
			screenStreamRef.current.getTracks().forEach((track) => {
				track.stop();
				console.log("Stopped screen share track:", track.kind);
			});
			screenStreamRef.current = null;
		}

		// Stop remote stream tracks
		if (remoteStream) {
			remoteStream.getTracks().forEach((track) => {
				track.stop();
			});
		}

		// Clear video elements
		if (localVideoRef.current) {
			localVideoRef.current.srcObject = null;
		}
		if (remoteVideoRef.current) {
			remoteVideoRef.current.srcObject = null;
		}

		// Reset states
		setIsScreenSharing(false);
		setIsConsumerTransportCreated(false);
		setIsAudioEnabled(true);
		setIsVideoEnabled(true);
		setRemoteStream(null);

		console.log("Cleanup completed");
	}, [
		audioProducer,
		videoProducer,
		screenProducer,
		audioConsumer,
		videoConsumer,
		screenConsumer,
		remoteStream,
	]);

	const toggleAudio = useCallback(() => {
		if (audioProducer) {
			if (isAudioEnabled) {
				audioProducer.pause();
			} else {
				audioProducer.resume();
			}
		}

		// Also control the actual track
		if (localStreamRef.current) {
			localStreamRef.current.getAudioTracks().forEach((track) => {
				track.enabled = !isAudioEnabled;
			});
		}

		setIsAudioEnabled(!isAudioEnabled);
	}, [audioProducer, isAudioEnabled]);

	const toggleVideo = useCallback(() => {
		if (videoProducer) {
			if (isVideoEnabled) {
				videoProducer.pause();
			} else {
				videoProducer.resume();
			}
		}

		// Also control the actual track
		if (localStreamRef.current) {
			localStreamRef.current.getVideoTracks().forEach((track) => {
				track.enabled = !isVideoEnabled;
			});
		}

		setIsVideoEnabled(!isVideoEnabled);
	}, [videoProducer, isVideoEnabled]);

	const toggleScreenShare = useCallback(async () => {
		try {
			if (isScreenSharing) {
				// Stop screen sharing
				if (screenProducer) {
					screenProducer.close();
					setScreenProducer(null);
				}
				if (screenStreamRef.current) {
					screenStreamRef.current.getTracks().forEach((track) => {
						track.stop();
					});
					screenStreamRef.current = null;
				}
				setIsScreenSharing(false);
			} else {
				const screenStream = await getScreenShare();

				if (sendTransportRef.current && screenStream) {
					const videoTrack = screenStream.getVideoTracks()[0];
					if (videoTrack) {
						const producer = await sendTransportRef.current.produce({
							track: videoTrack,
							appData: { mediaType: "screen" },
						});
						setScreenProducer(producer);
					}

					const audioTrack = screenStream.getAudioTracks()[0];
					if (audioTrack) {
						await sendTransportRef.current.produce({
							track: audioTrack,
							appData: { mediaType: "screen-audio" },
						});
						console.log("Screen audio producer created");
					}
				}
				setIsScreenSharing(true);
			}
		} catch (error) {
			console.error("Error toggling screen share:", error);
			setIsScreenSharing(false);
		}
	}, [isScreenSharing, screenProducer, getScreenShare]);

	// Initialize device
	useEffect(() => {
		const initializeDevice = async () => {
			if (deviceRef.current || isInitializingRef.current) {
				return;
			}

			isInitializingRef.current = true;
			try {
				const newDevice = new Device();
				deviceRef.current = newDevice;
			} catch (error) {
				console.error("Failed to initialize device:", error);
			} finally {
				isInitializingRef.current = false;
			}
		};

		initializeDevice();
	}, []);

	useEffect(() => {
		if (videoProducer) {
			console.log("this is video producer", videoProducer);
		}
	}, [videoProducer]);
	useEffect(() => {
		if (remoteStream && remoteVideoRef.current) {
			remoteVideoRef.current.srcObject = remoteStream;
		}
	}, [remoteStream]);

	useEffect(() => {
		if (!socket) return;

		socket.addEventListener("message", handleSocketMessage);
		return () => {
			socket.removeEventListener("message", handleSocketMessage);
		};
	}, [socket, handleSocketMessage]);

	return {
		localStreamRef,
		localVideoRef,
		remoteVideoRef,
		remoteStream,
		isAudioEnabled,
		isVideoEnabled,
		isScreenSharing,
		joinRoom,
		leaveRoom,
		toggleAudio,
		toggleVideo,
		toggleScreenShare,
		handleAudioCallAccepted,
		handleVideoCallAccepted,
	};
}
