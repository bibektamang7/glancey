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

interface RemoteStream {
	userId: string;
	stream: MediaStream;
	audioConsumer?: Consumer;
	videoConsumer?: Consumer;
	screenConsumer?: Consumer;
}

interface MediasoupClientHook {
	localVideoRef: React.RefObject<HTMLVideoElement | null>;
	remoteStreams: Map<string, RemoteStream>;
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
	getRemoteVideoRef: (
		userId: string
	) => React.RefObject<HTMLVideoElement | null>;
}

export function useMediasoupClient(room: Room): MediasoupClientHook {
	const session = useSession();
	const { socket } = useSocket();
	const sendTransportRef = useRef<Transport | null>(null);
	const recvTransportRef = useRef<Transport | null>(null);
	const [isConsumerTransportCreated, setIsConsumerTransportCreated] =
		useState(false);

	const [audioProducer, setAudioProducer] = useState<Producer | null>(null);
	const [videoProducer, setVideoProducer] = useState<Producer | null>(null);
	const [screenProducer, setScreenProducer] = useState<Producer | null>(null);
	const [isAudioEnabled, setIsAudioEnabled] = useState(true);
	const [isVideoEnabled, setIsVideoEnabled] = useState(true);
	const [isScreenSharing, setIsScreenSharing] = useState(false);
	const [currentCallType, setCurrentCallType] = useState<CALLTYPE>("audio");

	const [remoteStreams, setRemoteStreams] = useState<Map<string, RemoteStream>>(
		new Map()
	);
	const remoteVideoRefs = useRef<
		Map<string, React.RefObject<HTMLVideoElement | null>>
	>(new Map());

	const localVideoRef = useRef<HTMLVideoElement>(null);
	const localStreamRef = useRef<MediaStream | null>(null);
	const screenStreamRef = useRef<MediaStream | null>(null);

	const deviceRef = useRef<Device | null>(null);
	const isInitializingRef = useRef(false);

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
				console.log("Device initialized successfully");
			} catch (error) {
				console.error("Failed to initialize device:", error);
			} finally {
				isInitializingRef.current = false;
			}
		};

		initializeDevice();
	}, []);

	const getRemoteVideoRef = useCallback((userId: string) => {
		if (!remoteVideoRefs.current.has(userId)) {
			remoteVideoRefs.current.set(
				userId,
				React.createRef<HTMLVideoElement | null>()
			);
		}
		return remoteVideoRefs.current.get(userId)!;
	}, []);

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
	}, [socket, room.id, session.data?.user?.id, isConsumerTransportCreated]);

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
							console.log("Device loaded with RTP capabilities");
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
							// Start producing after transport is created
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

				case "userLeft":
					handleUserLeft(payload.userId);
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
									console.log(
										"Consumer transport params:",
										message.payload.params
									);
									const transport = await createRecvTransport(
										message.payload.params
									);
									if (transport) {
										handleConsume(payload.producerId, payload.senderUserId);
									}
								}
							};

							socket.addEventListener("message", onConsumerTransportConnected);
						} else {
							handleConsume(payload.producerId, payload.senderUserId);
						}
					}
					break;
			}
		},
		[room.id, session.data?.user?.id, socket, createConsumerTransport]
	);

	useEffect(() => {
		if (!socket) return;

		socket.addEventListener("message", handleSocketMessage);
		return () => {
			socket.removeEventListener("message", handleSocketMessage);
		};
	}, [socket, handleSocketMessage]);

	const handleAudioCallAccepted = useCallback(
		async (chatId: string) => {
			setCurrentCallType("audio");
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
			setCurrentCallType("video");
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
			console.log(
				"Producer closed:",
				data.producerId,
				"from user:",
				data.userId
			);

			setRemoteStreams((prev) => {
				const newStreams = new Map(prev);
				const userStream = newStreams.get(data.userId);
				if (userStream) {
					if (data.kind === "audio" && userStream.audioConsumer) {
						userStream.audioConsumer.close();
						userStream.audioConsumer = undefined;
					} else if (data.kind === "video" && userStream.videoConsumer) {
						userStream.videoConsumer.close();
						userStream.videoConsumer = undefined;
					} else if (userStream.screenConsumer) {
						userStream.screenConsumer.close();
						userStream.screenConsumer = undefined;
					}

					const newStream = new MediaStream();
					if (userStream.audioConsumer) {
						newStream.addTrack(userStream.audioConsumer.track);
					}
					if (userStream.videoConsumer) {
						newStream.addTrack(userStream.videoConsumer.track);
					}
					if (userStream.screenConsumer) {
						newStream.addTrack(userStream.screenConsumer.track);
					}

					userStream.stream = newStream;

					const videoRef = getRemoteVideoRef(data.userId);
					if (videoRef.current) {
						videoRef.current.srcObject = newStream;
					}
				}
				return newStreams;
			});
		},
		[getRemoteVideoRef]
	);

	const handleConsumerClosed = useCallback(
		(data: { consumerId: string; userId: string }) => {
			console.log(
				"Consumer closed:",
				data.consumerId,
				"for user:",
				data.userId
			);

			setRemoteStreams((prev) => {
				const newStreams = new Map(prev);
				const userStream = newStreams.get(data.userId);
				if (userStream) {
					if (userStream.audioConsumer?.id === data.consumerId) {
						userStream.audioConsumer.close();
						userStream.audioConsumer = undefined;
					} else if (userStream.videoConsumer?.id === data.consumerId) {
						userStream.videoConsumer.close();
						userStream.videoConsumer = undefined;
					} else if (userStream.screenConsumer?.id === data.consumerId) {
						userStream.screenConsumer.close();
						userStream.screenConsumer = undefined;
					}
				}
				return newStreams;
			});
		},
		[]
	);

	const handleUserLeft = useCallback((userId: string) => {
		console.log("User left:", userId);

		setRemoteStreams((prev) => {
			const newStreams = new Map(prev);
			const userStream = newStreams.get(userId);
			if (userStream) {
				userStream.audioConsumer?.close();
				userStream.videoConsumer?.close();
				userStream.screenConsumer?.close();

				userStream.stream.getTracks().forEach((track) => track.stop());
				newStreams.delete(userId);
			}
			return newStreams;
		});

		remoteVideoRefs.current.delete(userId);
	}, []);

	const createSendTransport = useCallback(
		async (transportOptions: any) => {
			if (!deviceRef.current) {
				console.error("Device not available for createSendTransport");
				return null;
			}
			try {
				const transport =
					deviceRef.current.createSendTransport(transportOptions);

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
									if (message.payload.userId !== session.data?.user?.id) {
										if (!recvTransportRef.current) {
											createConsumerTransport();
										}
										return;
									}

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
		[socket, room.id, createConsumerTransport, session.data?.user?.id]
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

	interface ConsumerProps {
		id: string;
		producerId: string;
		kind: string;
		producerPaused: boolean;
		type: string;
		rtpCapabilities: any;
		appData?: any;
	}
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
							consumerId: consumer.id,
							chatId: room.id,
						},
					})
				);

				setRemoteStreams((prev) => {
					const newStreams = new Map(prev);
					let userStream = newStreams.get(userId);

					if (!userStream) {
						userStream = {
							userId: userId,
							stream: new MediaStream(),
						};
						newStreams.set(userId, userStream);
					}

					// Add the track to the stream
					userStream.stream.addTrack(consumer.track);

					// Assign consumer based on kind and appData
					if (kind === "audio") {
						userStream.audioConsumer = consumer;
					} else if (kind === "video") {
						if (appData?.mediaType === "screen") {
							userStream.screenConsumer = consumer;
						} else {
							userStream.videoConsumer = consumer;
						}
					}

					return newStreams;
				});

				// Set video element source AFTER state update
				if (kind === "video") {
					setTimeout(() => {
						const videoRef = getRemoteVideoRef(userId);
						if (videoRef.current) {
							const userStream = remoteStreams.get(userId);
							if (userStream) {
								console.log("Setting remote video source for user:", userId);
								videoRef.current.srcObject = userStream.stream;

								// Ensure video plays
								videoRef.current.play().catch(console.error);
							}
						}
					}, 100);
				}
			} catch (error) {
				console.error("Failed to create consumer:", error);
			}
		},
		[socket, room.id, getRemoteVideoRef, createConsumerTransport]
	);

	const startProducing = useCallback(async () => {
		console.log("Starting to produce media...");

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
				console.log("Audio producer created:", audioProducer.id);
			}

			// Produce video only for video calls
			if (currentCallType === "video") {
				const videoTracks = localStreamRef.current.getVideoTracks();
				console.log("Video tracks available:", videoTracks.length);

				if (videoTracks.length > 0) {
					const videoProducer = await sendTransportRef.current.produce({
						track: videoTracks[0],
						appData: { mediaType: "video" },
					});
					setVideoProducer(videoProducer);
					console.log("Video producer created:", videoProducer.id);
				}
			}
		} catch (error) {
			console.error("Failed to start producing:", error);
		}
	}, [currentCallType]);

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

			console.log("Requesting media with constraints:", constraints);
			const stream = await navigator.mediaDevices.getUserMedia(constraints);
			localStreamRef.current = stream;

			console.log("Media stream obtained:", {
				audioTracks: stream.getAudioTracks().length,
				videoTracks: stream.getVideoTracks().length,
			});

			// Set local video element
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

			console.log("Joining room:", roomId, "Call type:", callType);
			setCurrentCallType(callType);

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

		// Clean up remote streams
		remoteStreams.forEach((userStream) => {
			userStream.audioConsumer?.close();
			userStream.videoConsumer?.close();
			userStream.screenConsumer?.close();
			userStream.stream.getTracks().forEach((track) => {
				track.stop();
			});
		});

		// Clear local video element
		if (localVideoRef.current) {
			localVideoRef.current.srcObject = null;
		}

		// Reset states
		setIsScreenSharing(false);
		setIsConsumerTransportCreated(false);
		setIsAudioEnabled(true);
		setIsVideoEnabled(true);
		setRemoteStreams(new Map());
		remoteVideoRefs.current.clear();

		console.log("Cleanup completed");
	}, [audioProducer, videoProducer, screenProducer, remoteStreams]);

	const toggleAudio = useCallback(() => {
		console.log("Toggling audio, current state:", isAudioEnabled);

		if (audioProducer) {
			if (isAudioEnabled) {
				audioProducer.pause();
				console.log("Audio producer paused");
			} else {
				audioProducer.resume();
				console.log("Audio producer resumed");
			}
		}

		// Also control the actual track
		if (localStreamRef.current) {
			localStreamRef.current.getAudioTracks().forEach((track) => {
				track.enabled = !isAudioEnabled;
				console.log("Audio track enabled:", track.enabled);
			});
		}

		setIsAudioEnabled(!isAudioEnabled);
	}, [audioProducer, isAudioEnabled]);

	const toggleVideo = useCallback(() => {
		console.log("Toggling video, current state:", isVideoEnabled);

		if (videoProducer) {
			if (isVideoEnabled) {
				videoProducer.pause();
				console.log("Video producer paused");
			} else {
				videoProducer.resume();
				console.log("Video producer resumed");
			}
		}

		// Also control the actual track
		if (localStreamRef.current) {
			localStreamRef.current.getVideoTracks().forEach((track) => {
				track.enabled = !isVideoEnabled;
				console.log("Video track enabled:", track.enabled);
			});
		}

		setIsVideoEnabled(!isVideoEnabled);
	}, [videoProducer, isVideoEnabled]);

	const toggleScreenShare = useCallback(async () => {
		console.log("Toggling screen share, current state:", isScreenSharing);

		try {
			if (isScreenSharing) {
				// Stop screen sharing
				if (screenProducer) {
					screenProducer.close();
					setScreenProducer(null);
					console.log("Screen producer closed");
				}
				if (screenStreamRef.current) {
					screenStreamRef.current.getTracks().forEach((track) => {
						track.stop();
					});
					screenStreamRef.current = null;
				}
				setIsScreenSharing(false);
			} else {
				// Start screen sharing
				const screenStream = await getScreenShare();

				if (sendTransportRef.current && screenStream) {
					const videoTrack = screenStream.getVideoTracks()[0];
					if (videoTrack) {
						const producer = await sendTransportRef.current.produce({
							track: videoTrack,
							appData: { mediaType: "screen" },
						});
						setScreenProducer(producer);
						console.log("Screen producer created:", producer.id);
					}

					// Also handle audio from screen share if available
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

	return {
		localVideoRef,
		remoteStreams,
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
		getRemoteVideoRef,
	};
}
