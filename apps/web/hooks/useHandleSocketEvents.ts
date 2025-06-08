import { useSocket } from "@/contexts/SocketProvider";
import { User } from "@/types/user";
import { useEffect, useState } from "react";
import { USER_MOVEMENT, USERS_NEAR_YOU } from "socket-events";

export const useHandleSocketEvents = () => {
	const { socket } = useSocket();
	const [nearUsers, setNearUsers] = useState<User[]>([]);
	const handleUserMovement = (user: User) => {
		setNearUsers((prev) => [
			...prev.filter((nearUser) => nearUser.id !== user.id),
			user,
		]);
	};
	const handleNearUsers = (users: User[]) => {
		// WHY DIRECTLY SETTING IT TO nearUser,
		// WHEN OUR LOCATION IS CHANGES, IT RETURNS TO USER WITHIN THE BOUNDARY
		setNearUsers(users);
	};

	const handleEventMessage = (message: any) => {
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
		socket.onmessage = (event) => {
			const message = JSON.parse(event.data);
			handleEventMessage(message);
		};
	}, [socket]);
	return { socket };
};
