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
	REQUEST_JOIN_CALL,
} from "socket-events";
import EventEmitter from "events";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import MapChat from "@/components/chat/MapChat";

const ChatContext = createContext<{
	chats: Chat[];
	handleSetChat: (chat: Chat) => void;
	handleSetMessage: (message: Message, chatId: string) => void;
}>({
	chats: [],
	handleSetChat: () => {
		console.log("Set function");
	},
	handleSetMessage: (message: Message, chatId: string) => {
		console.log("Set message function");
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
	const [openChat, setOpenChat] = useState<{
		isChatOpen: boolean;
		user: User | null;
		chatId: string;
	}>({
		isChatOpen: false,
		user: null,
		chatId: "",
	});

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
				console.log("this is chat", chat);
				if (!chat) {
					const newChat = {
						id: payload.chatId,
						lastMessage: message,
						messages: [message],
						name: payload.sender.name,
						participants: [payload.sender],
					} as Chat;
					setChats((prev) => [...prev, newChat]);

					toast("🔖 New message", {
						style: {
							width: "fit-content",
						},
						description: (
							<div className="flex items-center justify-start gap-2 !mt-2 text-black">
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
		<ChatContext.Provider value={{ chats, handleSetChat, handleSetMessage }}>
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
