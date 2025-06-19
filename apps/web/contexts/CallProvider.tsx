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
				<div className="flex gap-2 items-center justify-center !mt-2">
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
		// send socket events for rtp capabilities
		// just show user joined the call
	};
	const handleIncomingCallJoinRequest = (senderUser: User, chatId: string) => {
		//TODO: not sure: logic
	};
	const handleIncomingCallJoinAccepted = (chatId: string) => {
		//TODO: do other logics too
		toast("Join call accepted.");
	};
	const handleRejectIncomingJoinRequest = (rejectedBy: User) => {
		//TODO: do other logics too
		toast("Join call rejected.");
	};
	const handleUserLeave = () => {};
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

	const handleSocketCallEvents = (event: MessageEvent<any>) => {
		const message = JSON.parse(event.data);
		const payload = message.payload;
		switch (message.type) {
			case LEAVE_CALL: {
				handleUserLeave();
				break;
			}
			case INCOMING_AUDIO_CALL: {
				//TODO: need to handle call in the call, already existed chat
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
				// TODO: NOT quite sure
				// handleIncomingCallRejected(payload.rejectedBy)
				break;
			}
			case REQUEST_VIDEO_CALL: {
				handleIncomingCallJoinRequest(payload.from, payload.chatId);
				break;
			}
			case INCOMING_VIDEO_CALL: {
				// TODO: NOT SURE as well
				handleIncomingCallJoinAccepted(payload.chatId);
				break;
			}
			case ACCEPT_VIDEO_CALL: {
				handleRejectIncomingJoinRequest(payload.rejectedBy);
				break;
			}
			case VIDEO_CALL_REJECTED: {
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
				/>
			)}
			{children}
		</CallContext.Provider>
	);
};

export default CallProvider;
