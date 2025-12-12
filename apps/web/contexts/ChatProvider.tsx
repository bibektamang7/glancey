"use client";
import { Chat, Message } from "@/types/chat";
import { createContext, useContext, useEffect, useState } from "react";
import { useSocket } from "./SocketProvider";
import { User } from "@/types/user";
import { toast } from "sonner";
import {
	DELETE_MESSAGE_FROM_CHAT,
	RECEIVE_MESSAGE_IN_CHAT,
} from "socket-events";
import EventEmitter from "events";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import MapChat from "@/components/chat/MapChat";

const ChatContext = createContext<{
	chats: Chat[];
	handleSetChat: (chat: Chat) => void;
	handleSetMessage: (message: Message, chatId: string) => void;
	openChat: {
		isChatOpen: boolean;
		user: User | null;
		chatId: string;
	};
	handleCloseChat: () => void;
}>({
	chats: [],
	handleSetChat: () => {
		console.log("Set function");
	},
	handleSetMessage: (message: Message, chatId: string) => {
		console.log("Set message function");
	},
	openChat: {
		isChatOpen: false,
		user: null,
		chatId: "",
	},
	handleCloseChat: () => {},
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
	const [openChat, setOpenChat] = useState<{
		isChatOpen: boolean;
		user: User | null;
		chatId: string;
	}>({
		isChatOpen: false,
		user: null,
		chatId: "",
	});

	const handleCloseChat = () => {
		setOpenChat({
			isChatOpen: false,
			user: null,
			chatId: "",
		});
	};

	const handleSetChat = (chat: Chat) => {
		setChats((prev) => [...prev, chat]);
	};

	const handleSetMessage = (message: Message, chatId: string) => {
		setChats((prev) =>
			prev.map((chat) =>
				chat.id === chatId
					? ({ ...chat, messages: [...chat.messages, message] } as Chat)
					: chat
			)
		);
	};

	const handleMessage = (event: MessageEvent<any>) => {
		const message = JSON.parse(event.data);
		const payload = message.payload;
		switch (message.type) {
			case RECEIVE_MESSAGE_IN_CHAT: {
				const message = {
					id: payload.messageId,
					content: payload.content,
					createdAt: new Date(),
					sender: payload.sender,
				} as Message;
				const chat = chats.find((chat) => chat.id === payload.chatId);
				toast("🔖 New message", {
					style: {
						width: "fit-content",
					},
					description: (
						<div className="flex items-center justify-start gap-2 mt-2! text-black">
							<Avatar>
								<AvatarImage src={payload.sender.image} />
								<AvatarFallback>{payload.sender.name}</AvatarFallback>
							</Avatar>
							<div>
								<p className="font-semibold">{payload.sender.name}</p>
								<span className="font-light text-slate-700 line-clamp-2">
									{message.content}
								</span>
							</div>
						</div>
					),
					actionButtonStyle: { backgroundColor: "var(--color-blue-500)" },
					action: {
						label: "Open",
						onClick: () => {
							setOpenChat({
								isChatOpen: true,
								user: payload.sender,
								chatId: payload.chatId,
							});
						},
					},
				});

				if (!chat) {
					console.log("is that message inside")
					const newChat = {
						id: payload.chatId,
						lastMessage: message,
						messages: [message],
						name: payload.sender.name,
						participants: [payload.sender],
					} as Chat;
					setChats((prev) => [...prev, newChat]);
				} else {
					setChats((prev) =>
						prev.map((chat) =>
							chat.id === payload.chatId
								? ({ ...chat, messages: [...chat.messages, message] } as Chat)
								: chat
						)
					);
				}

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
		}
	};

	useEffect(() => {
		if (socket) {
			socket.addEventListener("message", handleMessage);
		}
		return () => {
			if (socket) {
				socket.removeEventListener("message", handleMessage);
			}
		};
	}, [socket, chats]);

	return (
		<ChatContext.Provider
			value={{
				chats,
				handleSetChat,
				handleSetMessage,
				openChat,
				handleCloseChat,
			}}
		>
			{openChat.isChatOpen && (
				<MapChat
					handleCloseChat={() =>
						setOpenChat({ isChatOpen: false, user: null, chatId: "" })
					}
					user={openChat.user!}
					chatId={openChat.chatId}
				/>
			)}
			{children}
		</ChatContext.Provider>
	);
};

export default ChatProvider;
