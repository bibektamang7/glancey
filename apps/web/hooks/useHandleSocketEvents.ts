import { useSocket } from "@/contexts/SocketProvider";
import { User } from "@/types/user";
import { useEffect, useState } from "react";
import { USER_MOVEMENT, USERS_NEAR_YOU } from "socket-events";

export interface NearerUser extends User {
	location: { longitude: number; latitude: number };
}

export const useHandleSocketEvents = () => {
	const { socket } = useSocket();
	const [nearUsers, setNearUsers] = useState<NearerUser[]>([]);
	const handleUserMovement = (user: NearerUser) => {
		setNearUsers((prev) => [
			...prev.filter((nearUser) => nearUser.id !== user.id),
			user,
		]);
	};
	const handleNearUsers = (users: NearerUser[]) => {
		// WHY DIRECTLY SETTING IT TO nearUser,
		// WHEN OUR LOCATION IS CHANGES, IT RETURNS TO USER WITHIN THE BOUNDARY
		setNearUsers(users);
	};

	const handleEventMessage = (event: MessageEvent<any>) => {
		const message = JSON.parse(event.data);
		const payload = message.payload;
		switch (message.type) {
			case USER_MOVEMENT: {
				handleUserMovement(payload.user);
				break;
			}
			case USERS_NEAR_YOU: {
				handleNearUsers(payload.aroundUsers);
				break;
			}
		}
	};

	useEffect(() => {
		if (!socket) return;
		socket.addEventListener("message", handleEventMessage);
		return () => {
			if (socket) {
				socket.removeEventListener("message", handleEventMessage);
			}
		};
	}, [socket]);
	return { socket, nearUsers };
};
