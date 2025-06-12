import { useEffect, useRef, useState } from "react";
import { Chat, Message } from "@/types/chat";
import {
	DELETE_MESSAGE_FROM_CHAT,
	RECEIVE_MESSAGE_IN_CHAT,
} from "socket-events";
import { eventEmitter } from "@/contexts/ChatProvider";
import { User } from "@/types/user";
import { useMapChat } from "@/contexts/ChatProvider";

export const useChat = () => {
	const { chats } = useMapChat();
	const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);
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

	const handleMessageReceive = ({
		sender,
		messageId,
		content,
		chatId,
	}: {
		sender: User;
		messageId: string;
		content: string;
		chatId: string;
	}) => {
		if (selectedChat && selectedChat.id === chatId) {
			const message = {
				id: messageId,
				content: content,
				sender,
				createdAt: new Date(),
			} as Message;
			setMessages((prev) => [...prev, message]);
		}
	};
	const handleDeleteMessage = ({
		messageId,
		deletedBy,
		chatId,
	}: {
		messageId: string;
		deletedBy: string;
		chatId: string;
	}) => {
		if (selectedChat && selectedChat.id === chatId) {
			setMessages((prev) =>
				prev.filter(
					(message) =>
						message.id !== messageId && message.sender.id !== deletedBy
				)
			);
		}
	};

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	useEffect(() => {
		eventEmitter.on(RECEIVE_MESSAGE_IN_CHAT, handleMessageReceive);
		eventEmitter.on(DELETE_MESSAGE_FROM_CHAT, handleDeleteMessage);
		return () => {
			eventEmitter.off(RECEIVE_MESSAGE_IN_CHAT, handleMessageReceive);
			eventEmitter.off(DELETE_MESSAGE_FROM_CHAT, handleDeleteMessage);
		};
	}, []);

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
