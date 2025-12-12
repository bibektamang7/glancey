"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useSocket } from "./SocketProvider";
import CallInterface from "@/pages/Call/CallInterface";
import { User } from "@/types/user";
import { Chat } from "@/types/chat";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	ACCEPT_VIDEO_CALL,
	AUDIO_CALL_ACCEPTED,
	AUDIO_CALL_REJECTED,
	INCOMING_AUDIO_CALL,
	INCOMING_VIDEO_CALL,
	LEAVE_CALL,
	REJECT_AUDIO_CALL,
	REJECT_INCOMING_AUDIO_CALL,
	REJECT_INCOMING_VIDEO_CALL,
	REQUEST_AUDIO_CALL,
	REQUEST_VIDEO_CALL,
	VIDEO_CALL_REJECTED,
} from "socket-events";
import MapChat from "@/components/chat/MapChat";
import { useMapChat } from "./ChatProvider";
import { PhoneCall, PhoneMissed, PhoneOff } from "lucide-react";
import { useSession } from "next-auth/react";

const CallContext = createContext<
	| {
			handleStartCall: (
				callType: CALLTYPE,
				roomId: string,
				callTo?: User
			) => void;
	  }
	| undefined
>(undefined);

export const useCall = () => {
	const ctx = useContext(CallContext);
	if (!ctx) {
		throw new Error("Not inside call context");
	}
	return ctx;
};

export type CALLTYPE = "audio" | "video" | null;
export interface Room {
	id: string;
	caller?: User;
	callTo?: User;
}

const CallProvider = ({ children }: { children: React.ReactNode }) => {
	const session = useSession();
	const { chats, openChat, handleCloseChat } = useMapChat();
	const { socket } = useSocket();
	const [callType, setCallType] = useState<CALLTYPE>(null);
	const [room, setRoom] = useState<Room | null>(null);
	const stableRoom = useMemo(() => room, [room?.id]);
	const stableCallType = useMemo(() => callType, [callType]);

	const handleStartCall = (
		callType: CALLTYPE,
		roomId: string,
		callTo?: User
	) => {
		setRoom({
			id: roomId,
			callTo,
		});
		setCallType(callType);
	};

	const handleRejectCall = (
		rejectedCall: "incoming" | "request",
		chatId: string
	) => {
		toast.dismiss();
		if (socket) {
			socket.send(
				JSON.stringify({
					type:
						rejectedCall === "incoming"
							? REJECT_INCOMING_AUDIO_CALL
							: REJECT_AUDIO_CALL,
					payload: {
						chatId,
						sender: session.data?.user?.id,
					},
				})
			);
		}
	};
	const handleAudioCallAccept = (caller: User, chatId: string) => {
		toast.dismiss();
		setCallType("audio");
		setRoom({
			caller,
			id: chatId,
		});
	};

	const handleIncomingAudioCall = (chatId: string, requestedUser: User) => {
		const chat = {
			id: chatId,
			participants: [requestedUser],
			name: requestedUser.name,
		} as Chat;
		toast("📞 Incoming call", {
			description: (
				<div className="flex items-center justify-start gap-2">
					<Avatar>
						<AvatarImage src={requestedUser.image} />
						<AvatarFallback>{requestedUser.name}</AvatarFallback>
					</Avatar>
					<span className="font-semibold">{requestedUser.name}</span>
				</div>
			),

			actionButtonStyle: { backgroundColor: "var(--color-blue-500)" },
			action: (
				<div className="flex gap-2 items-center justify-center mt-2!">
					<PhoneCall
						color="green"
						size={16}
						className="hover:cursor-pointer"
						onClick={() => handleAudioCallAccept(requestedUser, chatId)}
					/>
					<PhoneOff
						color="red"
						size={16}
						className="hover:cursor-pointer"
						onClick={() => handleRejectCall("incoming", chatId)}
					/>
				</div>
			),
		});
	};
	const handleRequestAudioCall = (requestedUser: User, chatId: string) => {
		const chat = {
			id: chatId,
			participants: [requestedUser],
			name: requestedUser.name,
		} as Chat;
		toast("📞  Request to Join call", {
			style: {
				width: "fit-content",
			},
			duration: 1000 * 60,
			description: (
				<div className="flex items-center justify-start gap-2 text-black !mt-2 !mr-2">
					<Avatar>
						<AvatarImage src={requestedUser.image} />
						<AvatarFallback>{requestedUser.name}</AvatarFallback>
					</Avatar>
					<div>
						<span className="font-semibold">{requestedUser.name}</span>
					</div>
				</div>
			),
			action: (
				<div className="flex gap-4 items-center justify-center !mt-2 !ml-4">
					<PhoneCall
						color="green"
						size={16}
						className="hover:cursor-pointer hover:bg-slate-300 hover:rounded-md"
						onClick={() => handleAudioCallAccept(requestedUser, chatId)}
					/>
					<PhoneOff
						color="red"
						size={16}
						className="hover:cursor-pointer hover:bg-slate-400 hover:rounded-md"
						onClick={() => handleRejectCall("request", chatId)}
					/>
				</div>
			),
		});
	};
	const handleAudioCallAccepted = (chatId: string, acceptedUser: User) => {
		//TODO: show user join
		toast.dismiss();
		setCallType("audio");
		setRoom({
			caller: acceptedUser,
			id: chatId,
		});
	};

	const handleVideoCallAccepted = (caller: User, chatId: string) => {
		toast.dismiss();
		setCallType("video");
		setRoom({
			caller,
			id: chatId,
		});
	};
	const handleIncomingCallJoinRequest = (
		requestedUser: User,
		chatId: string
	) => {
		toast("📞  Request to Join call", {
			style: {
				width: "fit-content",
			},
			duration: 1000 * 60,
			description: (
				<div className="flex items-center justify-start gap-2 text-black !mt-2 !mr-2">
					<Avatar>
						<AvatarImage src={requestedUser.image} />
						<AvatarFallback>{requestedUser.name}</AvatarFallback>
					</Avatar>
					<div>
						<span className="font-semibold">{requestedUser.name}</span>
					</div>
				</div>
			),
			action: (
				<div className="flex gap-4 items-center justify-center !mt-2 !ml-4">
					<PhoneCall
						color="green"
						size={16}
						className="hover:cursor-pointer hover:bg-slate-300 hover:rounded-md"
						onClick={() => handleVideoCallAccepted(requestedUser, chatId)}
					/>
					<PhoneOff
						color="red"
						size={16}
						className="hover:cursor-pointer hover:bg-slate-400 hover:rounded-md"
						onClick={() => handleRejectCall("request", chatId)}
					/>
				</div>
			),
		});
	};
	const handleIncomingCallJoinAccepted = (chatId: string, user: User) => {
		toast(`📞  Video Calling from ${user.name}`, {
			style: {
				width: "fit-content",
			},
			duration: 1000 * 60,
			description: (
				<div className="flex items-center justify-start gap-2 text-black !mt-2 !mr-2">
					<Avatar>
						<AvatarImage src={user.image} />
						<AvatarFallback>{user.name}</AvatarFallback>
					</Avatar>
					<div>
						<span className="font-semibold">{user.name}</span>
					</div>
				</div>
			),
			action: (
				<div className="flex gap-4 items-center justify-center !mt-2 !ml-4">
					<PhoneCall
						color="green"
						size={16}
						className="hover:cursor-pointer hover:bg-slate-300 hover:rounded-md"
						onClick={() => handleVideoCallAccepted(user, chatId)}
					/>
					<PhoneOff
						color="red"
						size={16}
						className="hover:cursor-pointer hover:bg-slate-400 hover:rounded-md"
						onClick={() => handleRejectIncomingVideoCall(chatId)}
					/>
				</div>
			),
		});
	};
	const handleRejectIncomingVideoCall = (chatId: string) => {
		toast.dismiss();
		if (socket) {
			socket.send(
				JSON.stringify({
					type: REJECT_INCOMING_VIDEO_CALL,
					payload: {
						sender: session.data?.user?.id,
						chatId,
					},
				})
			);
		}
	};
	const handleVideoCallRejected = (rejectedBy: User) => {
		toast(`Video call rejected by ${rejectedBy.name}`);
	};

	const handleAudioCallRejected = (rejectedBy: User) => {
		toast(`Audio call rejected by ${rejectedBy.name}`);
	};
	const handleSocketCallEvents = (event: MessageEvent<any>) => {
		const message = JSON.parse(event.data);
		const payload = message.payload;
		switch (message.type) {
			case INCOMING_AUDIO_CALL: {
				handleIncomingAudioCall(payload.chatId, payload.sender);
				break;
			}
			case REQUEST_AUDIO_CALL: {
				handleRequestAudioCall(payload.sender, payload.chatId);
				break;
			}
			case AUDIO_CALL_ACCEPTED: {
				handleAudioCallAccepted(payload.chatId, payload.acceptedBy);
				break;
			}
			case AUDIO_CALL_REJECTED: {
				handleAudioCallRejected(payload.rejectedBy);
				break;
			}
			case REQUEST_VIDEO_CALL: {
				handleIncomingCallJoinRequest(payload.sender, payload.chatId);
				break;
			}
			case INCOMING_VIDEO_CALL: {
				handleIncomingCallJoinAccepted(payload.chatId, payload.sender);
				break;
			}
			case VIDEO_CALL_REJECTED: {
				handleVideoCallRejected(payload.rejectedBy);
			}
		}
	};
	const closeCallInterfaceOnLeave = () => {
		setRoom(null);
		setCallType(null);
	};
	useEffect(() => {
		if (!socket) return;

		socket.addEventListener("message", handleSocketCallEvents);
		return () => {
			socket.removeEventListener("message", handleSocketCallEvents);
		};
	}, [socket, chats, room]);

	return (
		<CallContext.Provider
			value={{
				handleStartCall,
			}}
		>
			{openChat.isChatOpen && (
				<MapChat
					handleCloseChat={handleCloseChat}
					user={openChat.user!}
					chatId={openChat.chatId}
				/>
			)}
			{callType !== null && room && (
				<CallInterface
					callType={stableCallType}
					room={stableRoom!}
					closeCallInterfaceOnLeave={closeCallInterfaceOnLeave}
				/>
			)}
			{children}
		</CallContext.Provider>
	);
};

export default CallProvider;
