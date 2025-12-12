import AuthLayout from "@/components/AuthLayout";
import CustomSidebar from "@/components/CustomSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import CallProvider from "@/contexts/CallProvider";
import ChatProvider from "@/contexts/ChatProvider";
import { SocketProvider } from "@/contexts/SocketProvider";
import { SessionProvider } from "next-auth/react";
import React from "react";

const MapLayout = ({ children }: { children: React.ReactNode }) => {
	return (
		<SessionProvider refetchOnWindowFocus={false}>
			<AuthLayout>
				<SocketProvider>
					<SidebarProvider defaultOpen={false}>
						<CustomSidebar />
						<ChatProvider>
							<CallProvider>
								<section className="flex-1 z-10">{children}</section>
							</CallProvider>
						</ChatProvider>
					</SidebarProvider>
				</SocketProvider>
			</AuthLayout>
		</SessionProvider>
	);
};

export default MapLayout;
