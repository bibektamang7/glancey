import CustomSidebar from "@/components/CustomSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SocketProvider } from "@/contexts/SocketProvider";
import { SessionProvider } from "next-auth/react";
import React from "react";

const MapLayout = ({ children }: { children: React.ReactNode }) => {
	return (
		<SessionProvider refetchOnWindowFocus={false}>
			<SocketProvider>
				<SidebarProvider defaultOpen={false}>
					<CustomSidebar />
					<section className="flex-1 z-10">{children}</section>
				</SidebarProvider>
			</SocketProvider>
		</SessionProvider>
	);
};

export default MapLayout;
