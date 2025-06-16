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
import React, { useEffect, useRef } from "react";

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

const CallInterface = ({
	callType,
	room,
}: {
	callType: CALLTYPE;
	room: Room;
}) => {
	const isRendered = useRef(false);
	const {
		localVideoRef,
		remoteVideoRef,
		isAudioEnabled,
		isVideoEnabled,
		isScreenSharing,
		toggleAudio: onToggleAudio,
		toggleVideo: onToggleVideo,
		toggleScreenShare: onToggleScreenShare,
		joinRoom,
		leaveRoom,
	} = useMediasoupClient();

	const showVideo = callType === "video";

	const onLeaveCall = async () => {
		await leaveRoom();
	};

	const handleCallJoin = async () => {
		try {
			await joinRoom(room.id, callType, room.caller);
		} catch (error) {}
	};

	useEffect(() => {
		if (!isRendered.current) handleCallJoin();
		isRendered.current = true;
	}, []);

	return (
		<div className="fixed max-h-screen h-screen w-screen max-w-screen  flex flex-col items-center justify-center z-[50]">
			<div className="h-full w-full relative md:w-[60%] md:h-[80%]">
				{showVideo ? (
					<>
						<video
							ref={remoteVideoRef}
							autoPlay
							playsInline
							className="w-full h-full object-cover"
							style={{
								transform: isScreenSharing ? "none" : "scaleX(-1)",
							}}
						/>

						{callType === "video" && (
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
					</>
				) : (
					<div
						className={cn(
							"flex items-start justify-center bg-gradient-to-br h-full rounded-md",
							getRandomGradient()
						)}
					>
						<div className="text-center text-white !mt-12">
							<div className="w-12 h-12 md:w-16 md:h-16 bg-gray-600 rounded-full flex items-center justify-center !mx-auto !mb-2">
								<Avatar>
									<AvatarImage
										src={room.caller.image}
										alt="User profile in call"
									/>
									<AvatarFallback>{room.caller.name.charAt(0)}</AvatarFallback>
								</Avatar>
							</div>
							<h2 className="text-lg font-semibold md:text-xl">
								{room.caller.name}
							</h2>
							<p className="text-gray-300 !mb-2 text-xs md:text-base">
								calling
							</p>
						</div>
					</div>
				)}

				{showVideo && (
					<div className="absolute inset-0 flex items-center justify-center bg-gray-800 pointer-events-none">
						<div className="text-center text-white">
							<div className="w-24 h-24 bg-gray-600 rounded-full flex items-center justify-center !mx-auto !mb-4">
								<Users className="w-12 h-12" />
							</div>
							<p className="text-lg">Waiting for participant...</p>
						</div>
					</div>
				)}

				<div className="!p-6 absolute bottom-0 mx-auto bg-inherit w-full">
					<div className="flex items-center justify-center !space-x-4">
						<Button
							variant={isAudioEnabled ? "default" : "destructive"}
							className="rounded-full w-12 h-12 hover:cursor-pointer"
							onClick={onToggleAudio}
						>
							{isAudioEnabled ? (
								<Mic className="w-6 h-6" />
							) : (
								<MicOff className="w-6 h-6" />
							)}
						</Button>

						{callType === "video" && (
							<Button
								variant={isVideoEnabled ? "default" : "destructive"}
								className="rounded-full w-12 h-12 hover:cursor-pointer"
								onClick={onToggleVideo}
							>
								{isVideoEnabled ? (
									<Video className="w-6 h-6" />
								) : (
									<VideoOff className="w-6 h-6" />
								)}
							</Button>
						)}

						<Button
							variant={isScreenSharing ? "default" : "outline"}
							className="rounded-full w-12 h-12 hover:cursor-pointer"
							onClick={onToggleScreenShare}
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
						>
							<PhoneOff className="w-6 h-6" />
						</Button>

						<Button
							variant="outline"
							className="rounded-full w-12 h-12 hover:cursor-pointer"
						>
							<Settings className="w-6 h-6" />
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default CallInterface;
