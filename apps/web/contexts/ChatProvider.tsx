"use client";
import { Chat, Message } from "@/types/chat";
import { createContext, useContext, useEffect, useState } from "react";
import { useSocket } from "./SocketProvider";
import { User } from "@/types/user";
import { toast } from "sonner";
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
} from "socket-events";
import EventEmitter from "events";

const ChatContext = createContext<{
	chats: Chat[];
	handleSetChat: (chat: Chat) => void;
}>({
	chats: [],
	handleSetChat: () => {
		console.log("Set function");
	},
});

export const useMapChat = () => {
	const ctx = useContext(ChatContext);
	if (!ctx) {
		throw new Error("Cannot use outside");
	}

	return ctx;
};

export const eventEmitter = new EventEmitter();
eventEmitter.setMaxListeners(20);

const ChatProvider = ({ children }: { children: React.ReactNode }) => {
	const { socket } = useSocket();
	const [chats, setChats] = useState<Chat[]>([]);
	const handleSetChat = (chat: Chat) => {
		setChats((prev) => [...prev, chat]);
	};
	const handleRequestChatMessage = (
		user: User,
		chatId: string,
		message: string
	) => {
		const chatMessage = {
			id: user.id,
			sender: user.id,
			content: message,
			createdAt: Date.now(),
		} as unknown as Message;
		const chat = {
			id: chatId,
			lastMessage: chatMessage,
			messages: [chatMessage],
			name: user.name,
			participants: [user],
		} as Chat;
		handleSetChat(chat);
		toast(`New message from ${user.name}`);
	};

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

	useEffect(() => {
		if (socket) {
			socket.onmessage = (event) => {
				const message = JSON.parse(event.data);
				const payload = message.payload;
				switch (message.type) {
					case REQUEST_CHAT_MESSAGE: {
						handleRequestChatMessage(
							payload.requestBy,
							payload.chatId,
							payload.message
						);
						break;
					}
					case RECEIVE_MESSAGE_IN_CHAT: {
						eventEmitter.emit(RECEIVE_MESSAGE_IN_CHAT, {
							sender: payload.sender,
							messageId: payload.messageId,
							content: payload.content,
							chatId: payload.chatId,
						});
						break;
					}
					case DELETE_MESSAGE_FROM_CHAT: {
						eventEmitter.emit(DELETE_MESSAGE_FROM_CHAT, {
							messageId: payload.messageId,
							deletedBy: payload.by,
							chatId: payload.chatId
						});
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
						handleProducedMedia(
							payload.user,
							payload.chatId,
							payload.producerId
						);
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
		}
	}, [socket]);

	return (
		<ChatContext.Provider value={{ chats, handleSetChat }}>
			{children}
		</ChatContext.Provider>
	);
};

export default ChatProvider;
