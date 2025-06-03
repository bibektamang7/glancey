import React from "react";
import { SocketProvider } from "@/contexts/SocketProvider";

const MapLayout = ({ children }: { children: React.ReactNode }) => {
	return <SocketProvider>{children}</SocketProvider>;
	// return <main className="w-screen h-screen">{children}</main>;
};

export default MapLayout;
