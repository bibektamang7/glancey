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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

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

	const handleRemoveUserFromChat = (chatId: string, removedUserId: string) => {
		setChats((prev) =>
			prev.map((chat) => {
				chat.id === chatId &&
					chat.participants.filter(
						(participant) => participant.id != removedUserId
					);
				return chat;
			})
		);
	};

	const handleIncomingCall = (chatId: string, requestedUser: User) => {
		const chat = {
			id: chatId,
			participants: [requestedUser],
			name: requestedUser.name,
		} as Chat;
		toast("📞 Incoming call", {
			description: (
				<div>
					<div className="flex items-center justify-start gap-2">
						<Avatar>
							<AvatarImage src={requestedUser.image} />
							<AvatarFallback>{requestedUser.name}</AvatarFallback>
						</Avatar>
						<span>{requestedUser.name}</span>
					</div>
					<div className="flex gap-2 items-center">
						{requestedUser.interests.length > 0 &&
							requestedUser.interests.map((interest) => (
								<span className="text-sm font-semibold">{interest}</span>
							))}
					</div>
				</div>
			),
			action: (
				<>
					<Button>Accept</Button>
					<Button>Reject</Button>
				</>
			),
		});
		setChats((prev) => [...prev, chat]);
	};
	const handleRequestJoinCall = (requestedUser: User, chatId: string) => {
		const chat = {
			id: chatId,
			participants: [requestedUser],
			name: requestedUser.name,
		} as Chat;
		toast("📞 Request to Join call", {
			description: (
				<div>
					<div className="flex items-center justify-start gap-2">
						<Avatar>
							<AvatarImage src={requestedUser.image} />
							<AvatarFallback>{requestedUser.name}</AvatarFallback>
						</Avatar>
						<span>{requestedUser.name}</span>
					</div>
					<div className="flex gap-2 items-center">
						{requestedUser.interests.length > 0 &&
							requestedUser.interests.map((interest) => (
								<span className="text-sm font-semibold">{interest}</span>
							))}
					</div>
				</div>
			),
			action: (
				<>
					<Button>Accept</Button>
					<Button>Reject</Button>
				</>
			),
		});
	};
	const handleIncomingCallAccepted = (chatId: string, acceptedUser: User) => {
		// send socket events for rtp capabilities
	};
	const handleIncomingCallJoinRequest = (senderUser: User, chatId: string) => {
		//TODO: not sure: logic
		setChats((prev) =>
			prev.map((chat) => {
				chat.id === chatId && chat.participants.push(senderUser);
				return chat;
			})
		);
	};
	const handleIncomingCallJoinAccepted = (chatId: string) => {
		//TODO: do other logics too
		toast("Join call accepted.");
	};
	const handleRejectIncomingJoinRequest = (rejectedBy: User) => {
		//TODO: do other logics too
		toast("Join call rejected.");
	};
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
							chatId: payload.chatId,
						});
						break;
					}
					case REMOVED_FROM_CHAT: {
						handleRemoveUserFromChat(payload.chatId, payload.removedUserId);
						break;
					}
					case LEAVE_CALL: {
						handleRemoveUserFromChat(payload.chatId, payload.leftUserId);
						break;
					}
					case INCOMING_CALL: {
						//TODO: need to handle call in the call, already existed chat
						handleIncomingCall(payload.chatId, payload.requestBy);
						break;
					}
					case REQUEST_JOIN_CALL: {
						handleRequestJoinCall(payload.requestBy, payload.chatId);
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
						handleIncomingCallJoinRequest(payload.from, payload.chatId);
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
