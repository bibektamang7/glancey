import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CALLTYPE, Room } from "@/contexts/CallProvider";
import { useMediasoupClient } from "@/hooks/useMediasoup";
import { cn } from "@/lib/utils";
import {
	Mic,
	MicOff,
	Monitor,
	MonitorOff,
	PhoneOff,
	Settings,
	Users,
	Video,
	VideoOff,
} from "lucide-react";
import React, { useEffect, useRef, memo } from "react";

const getRandomGradient = () => {
	const gradients = [
		"from-purple-400 via-pink-500 to-red-500",
		"from-blue-400 via-purple-500 to-pink-500",
		"from-green-400 via-blue-500 to-purple-600",
		"from-yellow-400 via-red-500 to-pink-500",
		"from-indigo-400 via-purple-500 to-pink-500",
		"from-teal-400 via-blue-500 to-indigo-600",
		"from-orange-400 via-red-500 to-pink-600",
		"from-cyan-400 via-blue-500 to-purple-600",
		"from-emerald-400 via-teal-500 to-blue-600",
		"from-rose-400 via-pink-500 to-purple-600",
		"from-amber-400 via-orange-500 to-red-600",
		"from-lime-400 via-green-500 to-teal-600",
	];
	return gradients[Math.floor(Math.random() * gradients.length)];
};

interface CallInterfaceProps {
	callType: CALLTYPE;
	room: Room;
	closeCallInterfaceOnLeave: () => void;
}

const CallInterface = memo(
	({ callType, room, closeCallInterfaceOnLeave }: CallInterfaceProps) => {
		const isRendered = useRef(false);
		const gradientRef = useRef(getRandomGradient());

		const {
			localStreamRef,
			localVideoRef,
			isAudioEnabled,
			isVideoEnabled,
			isScreenSharing,
			toggleAudio: onToggleAudio,
			toggleVideo: onToggleVideo,
			toggleScreenShare: onToggleScreenShare,
			joinRoom,
			leaveRoom,
			handleAudioCallAccepted,
			handleVideoCallAccepted,
			remoteVideoRef,
		} = useMediasoupClient(room, callType);

		const onLeaveCall = async () => {
			await leaveRoom();
			closeCallInterfaceOnLeave();
		};

		const handleCallJoin = async () => {
			try {
				if (!room.caller && room.callTo) {
					await joinRoom(room.id, callType, room.callTo.id);
					return;
				}
				if (callType === "audio") {
					handleAudioCallAccepted(room.id);
				} else {
					handleVideoCallAccepted(room.id);
				}
			} catch (error) {
				console.log("Something went wrong while joining the call", error);
			}
		};

		useEffect(() => {
			if (!isRendered.current) {
				handleCallJoin();
				isRendered.current = true;
			}
		}, []);

		const renderVideoCall = () => {
			console.log(
				"this is remote video ref",
				remoteVideoRef.current?.srcObject
			);
			return (
				<div className="relative w-full h-full bg-gray-800">
					<video
						ref={remoteVideoRef}
						autoPlay
						playsInline
						className="w-full h-full object-cover"
						style={{
							transform: isScreenSharing ? "none" : "scaleX(-1)",
						}}
						onLoadedMetadata={() => {
							console.log("Remote video loaded");
						}}
						onError={(e) => {
							console.error("Remote video error:", e);
						}}
					/>

					{/* Local video in corner */}
					{isVideoEnabled && (
						<Card className="absolute top-4 right-4 w-48 h-36 overflow-hidden border-2 border-white">
							<video
								ref={localVideoRef}
								autoPlay
								playsInline
								muted
								className="w-full h-full object-cover"
								style={{ transform: "scaleX(-1)" }}
							/>
						</Card>
					)}

					{/* Screen Share Indicator */}
					{isScreenSharing && (
						<div className="absolute top-4 left-4 bg-red-500 text-white !px-3 !py-1 rounded-full text-sm font-medium">
							<Monitor className="w-4 h-4 inline !mr-1" />
							Sharing Screen
						</div>
					)}
				</div>
			);
		};

		// 4. Additional fix - Ensure local video stays connected
		useEffect(() => {
			if (localVideoRef.current && localStreamRef.current && isVideoEnabled) {
				// Re-attach local stream if it gets disconnected
				if (localVideoRef.current.srcObject !== localStreamRef.current) {
					console.log("Re-attaching local video stream");
					localVideoRef.current.srcObject = localStreamRef.current;
				}
			}
		}, [isVideoEnabled, localStreamRef.current]);

		const renderAudioCall = () => {
			return (
				<div
					className={cn(
						"flex items-start justify-center bg-gradient-to-br h-full rounded-md",
						gradientRef.current
					)}
				>
					<div className="text-center text-white !mt-12">
						<div className="w-12 h-12 md:w-16 md:h-16 bg-gray-600 rounded-full flex items-center justify-center !mx-auto !mb-2">
							<Avatar className="w-full h-full">
								<AvatarImage
									src={room.caller ? room.caller.image : room.callTo?.image}
									alt="User profile in call"
								/>
								<AvatarFallback>
									{room.caller
										? room.caller.name.charAt(0).toUpperCase()
										: room.callTo?.name.charAt(0).toUpperCase()}
								</AvatarFallback>
							</Avatar>
						</div>
						<h2 className="text-lg font-semibold md:text-xl">
							{!room.caller && room.callTo
								? room.callTo.name
								: room.caller?.name || "Unknown"}
						</h2>
					</div>
				</div>
			);
		};

		return (
			<div className="fixed max-h-screen h-screen w-screen max-w-screen flex flex-col items-center justify-center z-[50] bg-black">
				<div className="h-full w-full relative md:w-[60%] md:h-[80%]">
					{callType === "video" ? renderVideoCall() : renderAudioCall()}

					<div className="!p-6 absolute bottom-0 !mx-auto bg-inherit w-full">
						<div className="flex items-center justify-center !space-x-4">
							<Button
								variant={isAudioEnabled ? "default" : "destructive"}
								className="rounded-full w-12 h-12 hover:cursor-pointer"
								onClick={onToggleAudio}
								title={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
							>
								{isAudioEnabled ? (
									<Mic className="w-6 h-6" />
								) : (
									<MicOff className="w-6 h-6" />
								)}
							</Button>

							<Button
								variant={isVideoEnabled ? "default" : "destructive"}
								className="rounded-full w-12 h-12 hover:cursor-pointer"
								onClick={onToggleVideo}
								title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
							>
								{isVideoEnabled ? (
									<Video className="w-6 h-6" />
								) : (
									<VideoOff className="w-6 h-6" />
								)}
							</Button>

							<Button
								variant={isScreenSharing ? "default" : "outline"}
								className="rounded-full w-12 h-12 hover:cursor-pointer"
								onClick={onToggleScreenShare}
								title={isScreenSharing ? "Stop screen share" : "Share screen"}
							>
								{isScreenSharing ? (
									<MonitorOff className="w-6 h-6" />
								) : (
									<Monitor className="w-6 h-6" />
								)}
							</Button>

							<Button
								variant="destructive"
								className="rounded-full w-12 h-12 hover:cursor-pointer"
								onClick={onLeaveCall}
								title="End call"
							>
								<PhoneOff className="w-6 h-6" />
							</Button>

							<Button
								variant="outline"
								className="rounded-full w-12 h-12 hover:cursor-pointer"
								title="Settings"
							>
								<Settings className="w-6 h-6" />
							</Button>
						</div>
					</div>

					{/* Connection status indicator */}
					<div className="absolute top-4 left-4 text-white text-sm">
						<div className="flex items-center !space-x-2">
							<div className={cn("w-2 h-2 rounded-full")} />
						</div>
					</div>
				</div>
			</div>
		);
	}
);

CallInterface.displayName = "CallInterface";

export default CallInterface;
