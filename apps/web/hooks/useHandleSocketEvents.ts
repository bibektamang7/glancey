import { useSocket } from "@/contexts/SocketProvider";
import { User } from "@/types/user";
import { useEffect, useState } from "react";
import {
	DELETE_MESSAGE_FROM_CHAT,
	INCOMING_CALL,
	INCOMING_CALL_ACCEPTED,
	INCOMING_CALL_JOIN_ACCEPTED,
	INCOMING_CALL_JOIN_REQUEST,
	INCOMING_CALL_REJECTED,
	LEAVE_CALL,
	RECEIVE_MESSAGE_IN_CHAT,
	REJECT_INCOMING_CALL_JOIN_REQUEST,
	REMOVED_FROM_CHAT,
	REQUEST_CHAT_MESSAGE,
	REQUEST_JOIN_CALL,
	USER_MOVEMENT,
	USERS_NEAR_YOU,
} from "socket-events";
import { toast } from "sonner";

export const useHandleSocketEvents = () => {
	const { socket } = useSocket();
	const [nearUsers, setNearUsers] = useState<User[]>([]);
	const handleUserMovement = (user: User) => {
		setNearUsers((prev) => [
			...prev.filter((nearUser) => nearUser.id !== user.id),
			user,
		]);
	};
	const handleNearUsers = (users: User[]) => {
		// WHY DIRECTLY SETTING IT TO nearUser,
		// WHEN OUR LOCATION IS CHANGES, IT RETURNS TO USER WITHIN THE BOUNDARY
		setNearUsers(users);
	};
	const handleRequestChatMessage = (
		user: User,
		chatId: string,
		message: string
	) => {
		toast(`New message from ${user.name}`);
	};
	const handleMessageReceive = (
		sender: User,
		messageId: string,
		message: string,
		chatId: string
	) => {};
	const handleDeleteMessage = (messageId: string, userId: string) => {};
	const handleRemoveUserFromChat = (
		chatId: string,
		removedUserId: string
	) => {};
	const handleLeaveCall = (userId: string) => {};
	const handleIncomingCall = (chatId: string, requestedUser: User) => {};
	const handleRequestJoinCall = (requestedBy: User) => {};
	const handleIncomingCallAccepted = (chatId: string, acceptedUser: User) => {};
	const handleIncomingCallJoinRequest = (senderUser: User) => {};
	const handleIncomingCallJoinAccepted = (chatId: string) => {};
	const handleRejectIncomingJoinRequest = (rejectedBy: User) => {};
	const handleRtpCapabilities = (chatId: string, rtpCapabilities: any) => {};
	const handleProducerTransportCreated = (params: any) => {};
	const handleProducedMedia = (
		user: User,
		chatId: string,
		producerId: string
	) => {};
	const handleConsumerTransportCreated = (params: any, chatId: string) => {};
	const handleConsumerTransportConnected = (message: any, chatId: string) => {};
	const handleSubscribed = (params: any, chatId: string) => {};
	const handleResumed = (message: any) => {};
	const handleErrorOnMediaSoup = (message: string) => {};

	const handleEventMessage = (message: any) => {
		const payload = message.payload;
		switch (message.type) {
			case USER_MOVEMENT: {
				handleUserMovement(payload.user);
				break;
			}
			case USERS_NEAR_YOU: {
				handleNearUsers(payload.aroundUsers);
				break;
			}
			case REQUEST_CHAT_MESSAGE: {
				handleRequestChatMessage(
					payload.requestBy,
					payload.chatId,
					payload.message
				);
				break;
			}
			case RECEIVE_MESSAGE_IN_CHAT: {
				handleMessageReceive(
					payload.sender,
					payload.messageId,
					payload.content,
					payload.chatId
				);
				break;
			}
			case DELETE_MESSAGE_FROM_CHAT: {
				handleDeleteMessage(payload.messageId, payload.by);
				break;
			}
			case REMOVED_FROM_CHAT: {
				handleRemoveUserFromChat(payload.chatId, payload.removedUserId);
				break;
			}
			case LEAVE_CALL: {
				handleLeaveCall(payload.leftUserId);
				break;
			}
			case INCOMING_CALL: {
				//TODO: need to handle call in the call, already existed chat
				handleIncomingCall(payload.chatId, payload.requestBy);
				break;
			}
			case REQUEST_JOIN_CALL: {
				handleRequestJoinCall(payload.requestBy);
				break;
			}
			case INCOMING_CALL_ACCEPTED: {
				handleIncomingCallAccepted(payload.chatId, payload.acceptedBy);
				break;
			}
			case INCOMING_CALL_REJECTED: {
				// TODO: NOT quite sure
				// handleIncomingCallRejected(payload.rejectedBy)
				break;
			}
			case INCOMING_CALL_JOIN_REQUEST: {
				handleIncomingCallJoinRequest(payload.from);
				break;
			}
			case INCOMING_CALL_JOIN_ACCEPTED: {
				// TODO: NOT SURE as well
				handleIncomingCallJoinAccepted(payload.chatId);
				break;
			}
			case REJECT_INCOMING_CALL_JOIN_REQUEST: {
				handleRejectIncomingJoinRequest(payload.rejectedBy);
				break;
			}
			case "rtpCapabilities": {
				handleRtpCapabilities(payload.chatId, payload.rtpCapabilities);
				break;
			}
			case "producer_transport_created": {
				handleProducerTransportCreated(payload);
				break;
			}
			// ONE LEFT HERE
			case "produced_media": {
				handleProducedMedia(payload.user, payload.chatId, payload.producerId);
				break;
			}
			case "consumer_transport_created": {
				handleConsumerTransportCreated(payload.params, payload.chatId);
				break;
			}
			case "consumer_transport_connected": {
				handleConsumerTransportConnected(payload.message, payload.chatId);
				break;
			}
			case "subscribed": {
				handleSubscribed(payload.params, payload.chatId);
				break;
			}
			case "resumed": {
				handleResumed(payload.message);
				break;
			}
			case "error_on_media": {
				handleErrorOnMediaSoup(payload.message);
				break;
			}
		}
	};

	useEffect(() => {
		if (!socket) return;
		socket.onmessage = (event) => {
			const message = JSON.parse(event.data);
			handleEventMessage(message);
		};
	}, [socket]);
	return { socket };
};
