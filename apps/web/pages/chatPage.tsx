"use client";
import type React from "react";
import {
	MessageCircleMore,
	ArrowLeft,
	Send,
	Smile,
	Paperclip,
	Phone,
	Video,
	MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useChat } from "@/hooks/useChat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRef } from "react";
import { useMapChat } from "@/contexts/ChatProvider";
import { useCall } from "@/contexts/CallProvider";

const ChatPage = () => {
	const messageInputRef = useRef<HTMLTextAreaElement | null>(null);
	const { handleMapChatClose } = useMapChat();
	const { handleStartCall } = useCall();
	const {
		selectedChat,
		handleBackToList,
		handleChatSelect,
		handleSendMessage,
		chats,
		messages,
		messagesEndRef,
		session,
	} = useChat();

	const handleInput = () => {
		const textarea = messageInputRef.current;
		if (!textarea) return;

		textarea.style.height = "auto";

		const newHeight = Math.min(textarea.scrollHeight, 150);
		textarea.style.height = `${newHeight}px`;

		textarea.style.overflowY = textarea.scrollHeight > 150 ? "auto" : "hidden";
	};

	return (
		<div className="flex h-screen">
			<div
				className={cn(
					"w-full md:w-80 border-r bg-white flex flex-col",
					selectedChat && "hidden md:flex"
				)}
			>
				<div className="!p-4 border-b">
					<div className="flex items-center gap-2">
						<MessageCircleMore className="h-6 w-6" />
						<h1 className="text-xl font-bold">Chats</h1>
					</div>
				</div>

				<div className="flex-1 overflow-y-auto">
					{chats.map((chat) => (
						<div
							key={chat.id}
							onClick={() => handleChatSelect(chat)}
							className={cn(
								"!p-4 border-b hover:bg-gray-50 transition-colors cursor-pointer",
								selectedChat?.id === chat.id &&
									"bg-blue-50 border-r-2 border-r-blue-500"
							)}
						>
							<div className="flex items-center gap-3">
								<div className="relative">
									{chat.participants.map((participant) => (
										<Avatar key={participant.id}>
											<AvatarImage
												src={participant.image}
												loading="lazy"
											/>
											<AvatarFallback>
												{participant.name.charAt(0)}
											</AvatarFallback>
										</Avatar>
									))}
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center justify-between">
										<h3 className="font-semibold truncate">{chat.name}</h3>
									</div>
									<div className="flex items-center justify-between">
										<p className="text-sm text-gray-600 truncate">
											{chat.lastMessage?.content}
										</p>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>

			<div
				className={cn(
					"flex-1 flex flex-col",
					!selectedChat && "hidden md:flex"
				)}
			>
				{selectedChat ? (
					<>
						<div className="flex items-center justify-between !p-4 border-b bg-white">
							<div className="flex items-center gap-3">
								<Button
									variant="ghost"
									size="icon"
									onClick={handleBackToList}
									className="md:hidden"
								>
									<ArrowLeft className="h-5 w-5" />
								</Button>
								<div className="relative">
									{selectedChat.participants.map((participant) => (
										<Avatar key={participant.id}>
											<AvatarImage src={participant.image} />
											<AvatarFallback>
												{participant.name.charAt(0)}
											</AvatarFallback>
										</Avatar>
									))}
								</div>
								<div>
									<h2 className="font-semibold">{selectedChat.name}</h2>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<Button
									variant="ghost"
									size="icon"
									onClick={() => {
										handleMapChatClose();
										handleStartCall("audio", selectedChat.id);
									}}
								>
									<Phone className="h-5 w-5" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => {
										handleMapChatClose();
										handleStartCall("video", selectedChat.id);
									}}
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

						<div className="flex-1 overflow-y-auto !p-4 !space-y-4 bg-gray-50 scrollbar-hidden">
							{messages.map((message) => (
								<div
									key={message.id}
									className={cn(
										"flex",
										message.sender.id === session.data?.user?.id
											? "justify-end"
											: "justify-start"
									)}
								>
									<Avatar>
										<AvatarImage
											src={message.sender.image}
											loading="lazy"
										/>
										<AvatarFallback>
											{message.sender.name.charAt(0)}
										</AvatarFallback>
									</Avatar>
									<div
										className={cn(
											"max-w-[70%] rounded-lg !px-4 !py-2",
											message.sender.id === session.data?.user?.id
												? "bg-blue-500 text-white"
												: "bg-white text-gray-900 border"
										)}
									>
										<p className="text-sm">{message.content}</p>
										<div className="flex items-center justify-between !mt-1">
											<span
												className={cn(
													"text-xs",
													message.sender.id === session.data?.user?.id
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
							<div ref={messagesEndRef} />
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
									onClick={() => {
										if (messageInputRef.current) {
											handleSendMessage(messageInputRef.current.value);
										}
									}}
									size="icon"
								>
									<Send className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</>
				) : (
					<div className="flex-1 flex items-center justify-center bg-gray-50">
						<div className="text-center">
							<MessageCircleMore className="h-16 w-16 text-gray-400 mx-auto !mb-4" />
							<h2 className="text-xl font-semibold text-gray-600 !mb-2">
								Select a chat to start messaging
							</h2>
							<p className="text-gray-500">
								Choose from your existing conversations or start a new one
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default ChatPage;
