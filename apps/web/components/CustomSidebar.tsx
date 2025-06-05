import React from "react";
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarMenuButton,
	SidebarMenuItem,
} from "./ui/sidebar";
import Link from "next/link";
import Image from "next/image";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { sidebarLinks } from "@/data/sidebar";
import BottomNavigation from "./BottomNavbar";

const CustomSidebar = () => {
	return (
		<>
			<Sidebar
				variant="sidebar"
				collapsible="icon"
				className="z-40 hidden md:flex"
			>
				<SidebarHeader className="items-center border-b border-slate-400">
					<Image
						src={"/logo.png"}
						alt="Logo"
						width={28}
						height={28}
					/>
				</SidebarHeader>
				<SidebarContent className="list-none items-center !mt-2 !gap-4">
					{sidebarLinks.map((item) => (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton asChild>
								<Tooltip>
									<TooltipTrigger>
										<Link href={item.url}>
											<item.icon size={18} />
										</Link>
									</TooltipTrigger>
									<TooltipContent className="!p-2 !z-40">
										{item.title}
									</TooltipContent>
								</Tooltip>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarContent>
			</Sidebar>
			<BottomNavigation />
		</>
	);
};

export default CustomSidebar;
