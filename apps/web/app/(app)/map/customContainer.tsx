import CustomSidebar from "@/components/CustomSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import React from "react";

const CustomContainer = ({ children }: { children: React.ReactNode }) => {
	return (
		<SidebarProvider
			defaultOpen={false}
		>
			<CustomSidebar />
			<section className="flex-1 z-10">{children}</section>
		</SidebarProvider>
	);
};

export default CustomContainer;
