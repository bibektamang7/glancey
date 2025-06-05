"use client";
import CustomSidebar from "@/components/CustomSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import React from "react";

const CustomContainer = ({ children }: { children: React.ReactNode }) => {
	const isMobile = useIsMobile();
	return (
		<SidebarProvider
			defaultOpen={false}
		>
			<CustomSidebar />
			<section className="w-full h-screen z-10">{children}</section>
		</SidebarProvider>
	);
};

export default CustomContainer;
