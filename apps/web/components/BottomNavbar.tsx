"use client";
import { sidebarLinks } from "@/data/sidebar";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const BottomNavigation = () => {
	const pathname = usePathname();

	return (
		<nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden">
			<div className="flex items-center justify-around h-16 px-4">
				{sidebarLinks.map((item) => {
					const isActive = pathname === item.url;
					return (
						<Link
							key={item.title}
							href={item.url}
							className={cn(
								"flex flex-col items-center justify-center min-w-0 flex-1 px-2 py-2 text-xs font-medium transition-colors",
								isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
							)}
						>
							<item.icon
								size={20}
								className={cn(
									"mb-1",
									isActive ? "text-blue-600" : "text-gray-500"
								)}
							/>
							<span className="truncate">{item.title}</span>
						</Link>
					);
				})}
			</div>
		</nav>
	);
};

export default BottomNavigation;
