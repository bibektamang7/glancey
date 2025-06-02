import { createContext, useContext, useEffect, useState } from "react";

const SocketContext = createContext({});

export const useSocket = () => {
	const ctx = useContext(SocketContext);
	return ctx;
};

const SOCKET_URL = process.env.SOCKET_URL;

const handleUserOnline = () => {
	const isUserOnline = navigator.onLine;
	if (isUserOnline) {
		//TODO: DO SOMETHING
	}
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
	const [socket, setSocket] = useState<WebSocket | null>(null);
	useEffect(() => {
		if (!socket) {
			//need token, and location data
			const socketInstance = new WebSocket(`${SOCKET_URL}`);
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
