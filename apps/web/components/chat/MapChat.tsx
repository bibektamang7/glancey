import React, { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import {
	ArrowLeft,
	MoreVertical,
	Paperclip,
	Phone,
	Send,
	Smile,
	Video,
} from "lucide-react";
import { User } from "@/types/user";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Chat, Message } from "@/types/chat";
import ChatProvider, { useMapChat } from "@/contexts/ChatProvider";
import { cn } from "@/lib/utils";
import { useSocket } from "@/contexts/SocketProvider";
import { RECEIVE_MESSAGE_IN_CHAT, SEND_MESSAGE_IN_CHAT } from "socket-events";
import { useSession } from "next-auth/react";

import { eventEmitter } from "@/contexts/ChatProvider";

const MapChat = ({
	handleCloseChat,
	user,
	chatId,
}: {
	handleCloseChat: () => void;
	user: User;
	chatId?: string;
}) => {
	const session = useSession();
	const messageInputRef = useRef<HTMLTextAreaElement | null>(null);
	const { chats, handleSetChat } = useMapChat();
	const { socket } = useSocket();
	const [messages, setMessages] = useState<Message[]>([]);
	const chat = !chatId
		? ({
				id: user.id,
				name: user.name,
				participants: [user],
				messages: [],
			} as unknown as Chat)
		: chats.find((chat) => chat.id === chatId);

	const handleSendMessage = () => {
		if (messageInputRef.current && socket && session.data?.user) {
			const messageId = `${Math.random()}-${session.data.user.id}`;
			socket.send(
				JSON.stringify({
					type: SEND_MESSAGE_IN_CHAT,
					payload: {
						messageId,
						content: messageInputRef.current.value,
						requestTo: user.id,
						sender: session.data.user.id,
					},
				})
			);
			const message = {
				id: messageId,
				content: messageInputRef.current.value,
				createdAt: new Date(),
				sender: session.data.user,
			} as Message;
			setMessages((prev) => [...prev, message]);
		}
	};
	const handleInput = () => {
		const textarea = messageInputRef.current;
		if (!textarea) return;

		textarea.style.height = "auto";

		// Set height based on scroll height
		const newHeight = Math.min(textarea.scrollHeight, 150);
		textarea.style.height = `${newHeight}px`;

		// Toggle overflow based on height
		textarea.style.overflowY = textarea.scrollHeight > 150 ? "auto" : "hidden";
	};

	const handleMessageReceive = (payload: {
		sender: User;
		messageId: string;
		content: string;
		chatId: string;
	}) => {
		const message = {
			id: payload.messageId,
			content: payload.content,
			createdAt: new Date(),
			sender: payload.sender,
		} as Message;
		setMessages((prev) => [...prev, message]);
	};

	useEffect(() => {
		if (!chatId) {
			handleSetChat(chat!);
		} else {
			chat && setMessages(chat.messages!);
		}
	}, []);

	useEffect(() => {
		eventEmitter.on(RECEIVE_MESSAGE_IN_CHAT, handleMessageReceive);
		return () => {
			eventEmitter.off(RECEIVE_MESSAGE_IN_CHAT, handleMessageReceive);
		};
	}, []);
	return (
		<section className="h-screen max-h-screen w-full absolute right-0 top-0 lg:w-[30%] md:w-[40%] z-[500] rounded-lg">
			<div className="h-full flex flex-col">
				<div className="flex items-center justify-between !p-4 border-b bg-white ">
					<div className="flex items-center gap-3">
						<ArrowLeft
							size={18}
							onClick={handleCloseChat}
						/>
						<div className="relative">
							<Avatar>
								<AvatarImage src={user.image} />
								<AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
							</Avatar>
						</div>
						<span className="text-[1rem] text-slate-600 font-semibold tracking-tight">
							{user.name}
						</span>
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="icon"
						>
							<Phone className="h-5 w-5" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
						>
							<Video className="h-5 w-5" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
						>
							<MoreVertical className="h-5 w-5" />
						</Button>
					</div>
				</div>

				<div className="flex-1 overflow-y-auto !p-4 !space-y-4 bg-gray-50">
					{messages.map((message) => (
						<div
							key={message.id}
							className={cn(
								"flex",
								message.sender.id === "me" ? "justify-end" : "justify-start"
							)}
						>
							<div
								className={cn(
									"max-w-[70%] rounded-lg !px-4 !py-2",
									message.sender.id === "me"
										? "bg-blue-500 text-white"
										: "bg-white text-gray-900 border"
								)}
							>
								<p className="text-sm">{message.content}</p>
								<div className="flex items-center justify-between !mt-1">
									<span
										className={cn(
											"text-xs",
											message.sender.id === "me"
												? "text-blue-100"
												: "text-gray-500"
										)}
									>
										{message.createdAt.toDateString()}
									</span>
								</div>
							</div>
						</div>
					))}
					{/* <div ref={messagesEndRef} /> */}
				</div>

				<div className="!p-4 border-t bg-white">
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="icon"
						>
							<Paperclip className="h-5 w-5" />
						</Button>
						<div className="flex-1 relative">
							<textarea
								ref={messageInputRef}
								placeholder="Type a message..."
								className="!pr-10 !pl-2 w-full rounded-md border border-gray-300  text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-y-auto max-h-[150px] min-h-[40px]"
								rows={1}
								onInput={handleInput}
							/>

							<Button
								variant="ghost"
								size="icon"
								className="absolute right-1 top-1/2 transform -translate-y-1/2"
							>
								<Smile className="h-4 w-4" />
							</Button>
						</div>
						<Button
							onClick={handleSendMessage}
							size="icon"
						>
							<Send className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>
		</section>
	);
};

export default MapChat;
