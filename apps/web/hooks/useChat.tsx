import { useSocket } from "@/contexts/SocketProvider";
import { useEffect, useRef, useState } from "react";
import { Chat, Message } from "@/types/chat";

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
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

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
