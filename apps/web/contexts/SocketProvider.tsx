"use client";
import { useSession } from "next-auth/react";
import { createContext, useContext, useEffect, useState } from "react";

const SocketContext = createContext<{
	socket: WebSocket | null;
}>({
	socket: null,
});

export const useSocket = () => {
	const ctx = useContext(SocketContext);
	return ctx;
};

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;

const handleUserOnline = () => {
	const isUserOnline = navigator.onLine;
	if (isUserOnline) {
		//TODO: DO SOMETHING
	}
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
	const session = useSession();
	const [socket, setSocket] = useState<WebSocket | null>(null);
	useEffect(() => {
		if (!socket && session) {
			//need token, and location data
			// if () return;
			if (!session.data || !session.data.accessToken) return;
			const socketInstance = new WebSocket(
				`${SOCKET_URL}?token=${session.data?.accessToken}`
			);
			socketInstance.onopen = () => {
				console.log("Socket connection open");
			};
			// NOT SURE ABOUT THIS NOW
			socketInstance.close = (code, reason) => {
				handleUserOnline();
			};
			socketInstance.onerror = (event) => {
				handleUserOnline();
			};
			setSocket(socketInstance);
		}
	}, []);
	return (
		<SocketContext.Provider value={{ socket }}>
			{children}
		</SocketContext.Provider>
	);
};
