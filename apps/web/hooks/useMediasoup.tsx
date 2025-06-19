"use client";

import React from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import { Device } from "mediasoup-client";
import type { Transport, Producer, Consumer } from "mediasoup-client/types";
import { useSocket } from "@/contexts/SocketProvider";
import { CALLTYPE, Room } from "@/contexts/CallProvider";
import { User } from "@/types/user";
import {
	ACCEPT_AUDIO_CALL,
	CONNECT_PRODUCER,
	CONNECT_PRODUCER_TRANSPORT,
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
	const [recvTransport, setRecvTransport] = useState<Transport | null>(null);
	const [audioProducer, setAudioProducer] = useState<Producer | null>(null);
	const [videoProducer, setVideoProducer] = useState<Producer | null>(null);
	const [screenProducer, setScreenProducer] = useState<Producer | null>(null);
	const [isAudioEnabled, setIsAudioEnabled] = useState(true);
	const [isVideoEnabled, setIsVideoEnabled] = useState(true);
	const [isScreenSharing, setIsScreenSharing] = useState(false);
	const [currentCallType, setCurrentCallType] = useState<CALLTYPE>("audio");

	// Store multiple remote streams
	const [remoteStreams, setRemoteStreams] = useState<Map<string, RemoteStream>>(
		new Map()
	);
	const remoteVideoRefs = useRef<
		Map<string, React.RefObject<HTMLVideoElement | null>>
	>(new Map());

	const localVideoRef = useRef<HTMLVideoElement>(null);
	const localStreamRef = useRef<MediaStream | null>(null);
	const screenStreamRef = useRef<MediaStream | null>(null);

	// Use refs to prevent multiple device creation
	const deviceRef = useRef<Device | null>(null);
	const isInitializingRef = useRef(false);

	// Initialize device only once
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
	}, []); // Empty dependency array - only run once

	// Function to get or create remote video ref for a user
	const getRemoteVideoRef = useCallback((userId: string) => {
		if (!remoteVideoRefs.current.has(userId)) {
			remoteVideoRefs.current.set(
				userId,
				React.createRef<HTMLVideoElement | null>()
			);
		}
		return remoteVideoRefs.current.get(userId)!;
	}, []);

	// WebSocket message handler
	const handleSocketMessage = useCallback(
		async (event: MessageEvent) => {
			const message = JSON.parse(event.data);
			const payload = message.payload;

			switch (message.type) {
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

				case "consumer_transport_created":
					if (payload.chatId === room.id) {
						await createRecvTransport(payload.params);
					}
					break;

				case "newConsumer":
					await createConsumer(payload);
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
			}
		},
		[room.id, session.data?.user?.id, socket]
	);

	// Setup socket event listener
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

	// Handle producer closed
	const handleProducerClosed = useCallback(
		(data: { producerId: string; userId: string }) => {
			console.log(
				"Producer closed:",
				data.producerId,
				"from user:",
				data.userId
			);

			// Update remote streams to remove the closed producer's track
			setRemoteStreams((prev) => {
				const newStreams = new Map(prev);
				const userStream = newStreams.get(data.userId);
				if (userStream) {
					// Remove the specific track based on producer type
					// This would need more info from the server about which track was closed
					console.log("Handling producer closure for user:", data.userId);
				}
				return newStreams;
			});
		},
		[]
	);

	// Handle consumer closed
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
					// Close and remove the specific consumer
					// Update the stream accordingly
				}
				return newStreams;
			});
		},
		[]
	);

	// Handle user left
	const handleUserLeft = useCallback((userId: string) => {
		console.log("User left:", userId);

		setRemoteStreams((prev) => {
			const newStreams = new Map(prev);
			const userStream = newStreams.get(userId);
			if (userStream) {
				// Close all consumers for this user
				userStream.audioConsumer?.close();
				userStream.videoConsumer?.close();
				userStream.screenConsumer?.close();

				// Stop all tracks
				userStream.stream.getTracks().forEach((track) => track.stop());

				newStreams.delete(userId);
			}
			return newStreams;
		});

		// Clean up video ref
		remoteVideoRefs.current.delete(userId);
	}, []);

	// Create send transport
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
						alert("which one first");
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
						alert("is this one ");
						try {
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

							// Wait for producer ID from server
							const handleProducerCreated = (event: MessageEvent) => {
								const message = JSON.parse(event.data);
								if (message.type === "produced_media") {
									callback({ id: message.payload.producerId });
									socket?.removeEventListener("message", handleProducerCreated);
								}
							};
							socket?.addEventListener("message", handleProducerCreated, {
								once: true,
							});
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
		[socket, room.id]
	);

	// Create receive transport
	const createRecvTransport = useCallback(
		async (transportOptions: any) => {
			if (!deviceRef.current) {
				console.error("Device not available for createRecvTransport");
				return;
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
										dtlsParameters,
										chatId: room.id,
									},
								})
							);
							callback();
						} catch (error: any) {
							errback(error);
						}
					}
				);

				setRecvTransport(transport);
				return transport;
			} catch (error) {
				console.error("Failed to create receive transport:", error);
			}
		},
		[socket, room.id]
	);

	// Create consumer for remote streams
	const createConsumer = useCallback(
		async (consumerData: {
			id: string;
			producerId: string;
			kind: string;
			rtpParameters: any;
			userId: string;
			appData?: any;
		}) => {
			if (!recvTransport) {
				console.error("No receive transport available");
				return;
			}

			try {
				const consumer = await recvTransport.consume({
					id: consumerData.id,
					producerId: consumerData.producerId,
					kind: consumerData.kind as "audio" | "video",
					rtpParameters: consumerData.rtpParameters,
					appData: consumerData.appData,
				});

				// Update remote streams
				setRemoteStreams((prev) => {
					const newStreams = new Map(prev);
					let userStream = newStreams.get(consumerData.userId);

					if (!userStream) {
						userStream = {
							userId: consumerData.userId,
							stream: new MediaStream(),
						};
						newStreams.set(consumerData.userId, userStream);
					}

					// Add the track to the user's stream
					userStream.stream.addTrack(consumer.track);

					// Store the consumer reference
					if (consumerData.kind === "audio") {
						userStream.audioConsumer = consumer;
					} else if (consumerData.kind === "video") {
						if (consumerData.appData?.mediaType === "screen") {
							userStream.screenConsumer = consumer;
						} else {
							userStream.videoConsumer = consumer;
						}
					}

					// Update video element if it's a video track
					if (consumerData.kind === "video") {
						const videoRef = getRemoteVideoRef(consumerData.userId);
						if (videoRef.current) {
							videoRef.current.srcObject = userStream.stream;
						}
					}

					return newStreams;
				});

				// Resume the consumer
				socket?.send(
					JSON.stringify({
						type: "resume",
						payload: {
							consumerId: consumer.id,
							chatId: room.id,
						},
					})
				);
			} catch (error) {
				console.error("Failed to create consumer:", error);
			}
		},
		[recvTransport, socket, room.id, getRemoteVideoRef]
	);
	// Start producing media after transport is created
	const startProducing = useCallback(async () => {
		if (
			!sendTransportRef ||
			!sendTransportRef.current ||
			!localStreamRef.current
		)
			return;

		try {
			// Produce audio if available
			const audioTrack = localStreamRef.current.getAudioTracks()[0];
			if (audioTrack) {
				const audioProducer = await sendTransportRef.current.produce({
					track: audioTrack,
					appData: { mediaType: "audio" },
				});
				setAudioProducer(audioProducer);
			}

			// Produce video if available and call type is video
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
			}

			const stream = await navigator.mediaDevices.getUserMedia(constraints);
			localStreamRef.current = stream;
			console.log("current stream ref changed righ", localStreamRef.current);

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

	// Leave room
	const leaveRoom = useCallback(async () => {
		// Close producers
		audioProducer?.close();
		videoProducer?.close();
		screenProducer?.close();

		// Close transports
		sendTransportRef.current?.close();
		recvTransport?.close();

		// Stop local streams
		localStreamRef.current?.getTracks().forEach((track) => track.stop());
		screenStreamRef.current?.getTracks().forEach((track) => track.stop());

		// Close all remote streams and consumers
		remoteStreams.forEach((userStream) => {
			userStream.audioConsumer?.close();
			userStream.videoConsumer?.close();
			userStream.screenConsumer?.close();
			userStream.stream.getTracks().forEach((track) => track.stop());
		});

		// Reset state
		sendTransportRef.current = null;
		setRecvTransport(null);
		setAudioProducer(null);
		setVideoProducer(null);
		setScreenProducer(null);
		setIsScreenSharing(false);
		setRemoteStreams(new Map());
		remoteVideoRefs.current.clear();
	}, [
		audioProducer,
		videoProducer,
		screenProducer,
		sendTransportRef.current,
		recvTransport,
		remoteStreams,
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

		localStreamRef.current?.getVideoTracks().forEach((track) => {
			track.enabled = !isVideoEnabled;
		});

		setIsVideoEnabled(!isVideoEnabled);
	}, [videoProducer, isVideoEnabled]);

	// Toggle screen share
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
