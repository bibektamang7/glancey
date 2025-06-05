import CustomSidebar from "@/components/CustomSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SocketProvider } from "@/contexts/SocketProvider";
import { SessionProvider } from "next-auth/react";
import React from "react";

const MapLayout = ({ children }: { children: React.ReactNode }) => {
	return (
		<SessionProvider refetchOnWindowFocus={false}>
			<SocketProvider>
				{children}
			</SocketProvider>
		</SessionProvider>
	);
};

export default MapLayout;
