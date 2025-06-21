"use client";

import React from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import { Device } from "mediasoup-client";
import type { Transport, Producer, Consumer } from "mediasoup-client/types";
import { useSocket } from "@/contexts/SocketProvider";
import { CALLTYPE, Room } from "@/contexts/CallProvider";
import {
	ACCEPT_AUDIO_CALL,
	CONNECT_CONSUMER,
	CONNECT_PRODUCER,
	CONNECT_PRODUCER_TRANSPORT,
	CREATE_CONSUMER_TRANSPORT,
	CREATE_PRODUCER_TRANSPORT,
	REQUEST_AUDIO_CALL,
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
						await createSendTransport(payload.transport);
						await startProducing();
					}
					break;

				case "subscribed": {
					await createConsumer(payload.params, payload.remoteUserId);
					break;
				}

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

							// Set up one-time listener for consumer_transport_connected
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
									console.log("what is the params", message.payload.params);
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
				await getUserMedia("audio");
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
				await getUserMedia("video");
			} catch (error) {
				console.error("Failed to get user media:", error);
				throw error;
			}
			if (socket) {
				socket.send(
					JSON.stringify({
						type: "ACCEPT_VIDEO_CALL", // Add proper constant
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
				return;
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
										// Create consumer transport if it doesn't exist
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
			}
		},
		[socket, room.id, createConsumerTransport]
	);

	const createRecvTransport = useCallback(
		async (transportOptions: any) => {
			if (!deviceRef.current) {
				console.error("Device not available for createRecvTransport");
				return;
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
			}
		},
		[socket, room.id]
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

					userStream.stream.addTrack(consumer.track);

					if (kind === "audio") {
						userStream.audioConsumer = consumer;
					} else if (kind === "video") {
						if (appData?.mediaType === "screen") {
							userStream.screenConsumer = consumer;
						} else {
							userStream.videoConsumer = consumer;
						}
					}

					if (kind === "video") {
						const videoRef = getRemoteVideoRef(userId);
						if (videoRef.current) {
							videoRef.current.srcObject = userStream.stream;
						}
					}

					return newStreams;
				});
			} catch (error) {
				console.error("Failed to create consumer:", error);
			}
		},
		[
			socket,
			room.id,
			getRemoteVideoRef,
			createConsumerTransport,
			recvTransportRef.current,
		]
	);

	const startProducing = useCallback(async () => {
		if (
			!sendTransportRef ||
			!sendTransportRef.current ||
			!localStreamRef.current
		)
			return;

		try {
			const audioTrack = localStreamRef.current.getAudioTracks()[0];
			if (audioTrack) {
				const audioProducer = await sendTransportRef.current.produce({
					track: audioTrack,
					appData: { mediaType: "audio" },
				});
				setAudioProducer(audioProducer);
			}

			if (currentCallType === "video") {
				const videoTrack = localStreamRef.current.getVideoTracks()[0];
				if (videoTrack) {
					const videoProducer = await sendTransportRef.current.produce({
						track: videoTrack,
						appData: { mediaType: "video" },
					});
					setVideoProducer(videoProducer);
				}
			}
		} catch (error) {
			console.error("Failed to start producing:", error);
		}
	}, [sendTransportRef.current, currentCallType]);

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
			}

			const stream = await navigator.mediaDevices.getUserMedia(constraints);
			localStreamRef.current = stream;
			console.log("current stream ref changed", localStreamRef.current);

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

	const joinRoom = useCallback(
		async (roomId: string, callType: CALLTYPE, callToId: string) => {
			if (!socket) return;

			setCurrentCallType(callType);
			try {
				await getUserMedia(callType);
			} catch (error) {
				console.error("Failed to get user media:", error);
				throw error;
			}

			socket.send(
				JSON.stringify({
					type: REQUEST_AUDIO_CALL,
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
		audioProducer?.close();
		videoProducer?.close();
		screenProducer?.close();

		sendTransportRef.current?.close();
		recvTransportRef.current?.close();

		localStreamRef.current?.getTracks().forEach((track) => track.stop());
		screenStreamRef.current?.getTracks().forEach((track) => track.stop());

		remoteStreams.forEach((userStream) => {
			userStream.audioConsumer?.close();
			userStream.videoConsumer?.close();
			userStream.screenConsumer?.close();
			userStream.stream.getTracks().forEach((track) => track.stop());
		});

		sendTransportRef.current = null;
		recvTransportRef.current = null;
		setAudioProducer(null);
		setVideoProducer(null);
		setScreenProducer(null);
		setIsScreenSharing(false);
		setIsConsumerTransportCreated(false);
		setRemoteStreams(new Map());
		remoteVideoRefs.current.clear();
	}, [audioProducer, videoProducer, screenProducer, remoteStreams]);

	const toggleAudio = useCallback(() => {
		if (audioProducer) {
			if (isAudioEnabled) {
				audioProducer.pause();
			} else {
				audioProducer.resume();
			}
		}

		localStreamRef.current?.getAudioTracks().forEach((track) => {
			track.enabled = !isAudioEnabled;
		});

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

		localStreamRef.current?.getVideoTracks().forEach((track) => {
			track.enabled = !isVideoEnabled;
		});

		setIsVideoEnabled(!isVideoEnabled);
	}, [videoProducer, isVideoEnabled]);

	const toggleScreenShare = useCallback(async () => {
		try {
			if (isScreenSharing) {
				if (screenProducer) {
					screenProducer.close();
					setScreenProducer(null);
				}
				screenStreamRef.current?.getTracks().forEach((track) => track.stop());
				setIsScreenSharing(false);
			} else {
				const screenStream = await getScreenShare();
				setIsScreenSharing(true);

				if (sendTransportRef.current && screenStream) {
					const videoTrack = screenStream.getVideoTracks()[0];
					if (videoTrack) {
						const producer = await sendTransportRef.current.produce({
							track: videoTrack,
							appData: { mediaType: "screen" },
						});
						setScreenProducer(producer);
					}
				}
			}
		} catch (error) {
			console.error("Error toggling screen share:", error);
			setIsScreenSharing(false);
		}
	}, [
		isScreenSharing,
		screenProducer,
		sendTransportRef.current,
		getScreenShare,
	]);

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
