import React, { useRef } from "react";
import { Button } from "../ui/button";
import { Paperclip, Send, Smile } from "lucide-react";
import { useSocket } from "@/contexts/SocketProvider";
import { useMapChat } from "@/contexts/ChatProvider";
import { useSession } from "next-auth/react";
import { SEND_MESSAGE_IN_CHAT } from "socket-events";
import { User } from "@/types/user";
import { Message } from "@/types/chat";

const ChatInput = ({
	user,
	chatId,
	setMessages,
}: {
	user: User;
	chatId: string;
	setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}) => {
	const session = useSession();
	const messageInputRef = useRef<HTMLTextAreaElement | null>(null);
	const { socket } = useSocket();
	const { handleSetMessage } = useMapChat();

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
						chatId,
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
			handleSetMessage(message, chatId);
			messageInputRef.current.value = "";
		}
	};
	const handleInput = () => {
		const textarea = messageInputRef.current;
		if (!textarea) return;

		textarea.style.height = "auto";

		const newHeight = Math.min(textarea.scrollHeight, 150);
		textarea.style.height = `${newHeight}px`;

		textarea.style.overflowY = textarea.scrollHeight > 150 ? "auto" : "hidden";
	};

	return (
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
	);
};

export default ChatInput;
