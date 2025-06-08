import { useSocket } from "@/contexts/SocketProvider";
import { useEffect, useRef, useState } from "react";
import { Chat, Message } from "@/types/chat";
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

export const useChat = () => {
	const [chats, setChats] = useState<Chat[]>([]);
	const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);
	const { socket } = useSocket();
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const handleChatSelect = (chat: Chat) => {
		setSelectedChat(chat);
	};

	const handleBackToList = () => {
		setSelectedChat(null);
	};

	const handleSendMessage = () => {};
	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	// Socket events function
	const handleRequestChatMessage = () => {};
	const handleMessageReceive = () => {};
	const handleMessageDelete = () => {};
	const hanldeRemoveUserFromChat = () => {};

	// media soup events
	const handleUserLeaveCall = () => {};
	const handleIncomingCall = () => {};
	const handleRequestJoinCall = () => {};
	const handleIncomingCallAccepted = () => {};
	const handleIncomingCallRejected = () => {};
	const handleIncomingCallJoinRequest = () => {};
	const handleIncomingCallJoinAccepted = () => {};
	const handleRejectIncomingCallJoinRequest = () => {};

	const handleRtpCapabilities = () => {};
	const handleProducerTransportCreated = () => {};
	const handeProducerConnected = () => {};
	const handleProducedMedia = () => {};
	const handleConsumerTransportCreated = () => {};
	const handleConsumerTransportConnected = () => {};
	const handleSubscribed = () => {};
	const handleResumed = () => {};
	const handleErrorOnMedia = () => {};

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	useEffect(() => {
		if (socket) {
			socket.onmessage = (event) => {
				const message = JSON.parse(event.data);
				const payload = message.payload;

				switch (message.type) {
					case REQUEST_CHAT_MESSAGE: {
						handleRequestChatMessage();
						break;
					}
					case RECEIVE_MESSAGE_IN_CHAT: {
						handleMessageReceive();
						break;
					}
					case DELETE_MESSAGE_FROM_CHAT: {
						handleMessageDelete();
						break;
					}
					case REMOVED_FROM_CHAT: {
						hanldeRemoveUserFromChat();
						break;
					}
					case LEAVE_CALL: {
						handleUserLeaveCall();
						break;
					}
					case INCOMING_CALL: {
						handleIncomingCall();
						break;
					}
					case REQUEST_JOIN_CALL: {
						handleRequestJoinCall();
						break;
					}
					case INCOMING_CALL_ACCEPTED: {
						handleIncomingCallAccepted();
						break;
					}

					case INCOMING_CALL_REJECTED: {
						handleIncomingCallRejected();
						break;
					}
					case INCOMING_CALL_JOIN_REQUEST: {
						handleIncomingCallJoinRequest();
						break;
					}
					case INCOMING_CALL_JOIN_ACCEPTED: {
						handleIncomingCallJoinAccepted();
						break;
					}
					case REJECT_INCOMING_CALL_JOIN_REQUEST: {
						handleRejectIncomingCallJoinRequest();
						break;
					}

					// media soup events
					case "rtpCapabilities": {
						handleRtpCapabilities();
						break;
					}
					case "producer_transport_created": {
						handleProducerTransportCreated();
						break;
					}
					case "producer_connected": {
						handeProducerConnected();
						break;
					}
					case "produced_media": {
						handleProducedMedia();
						break;
					}
					case "consumer_transport_created": {
						handleConsumerTransportCreated();
						break;
					}
					case "consumer_transport_connected": {
						handleConsumerTransportConnected();
						break;
					}
					case "subscribed": {
						handleSubscribed();
						break;
					}
					case "resumed": {
						handleResumed();
						break;
					}
					case "error_on_media": {
						handleErrorOnMedia();
						break;
					}
				}
			};
		}
	}, [socket]);

	return {
		selectedChat,
		handleKeyPress,
		handleSendMessage,
		handleBackToList,
		handleChatSelect,
		chats,
		messages,
		messagesEndRef,
	};
};
