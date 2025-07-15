"use client";
import LoaderComponent from "@/components/Loader";
import { User } from "@/types/user";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const Map = dynamic(
	() => import("@/components/map/Map").then((component) => component.Map),
	{
		ssr: false,
	}
);

const MapContainer = ({ user }: { user: User }) => {
	const router = useRouter();

	useEffect(() => {
		if (user.interests.length < 1) {
			router.replace("/set-interests");
		}
	}, [user, router]);

	if (user.interests.length < 1 || !user) {
		return <LoaderComponent />;
	}

	return (
		<div
			style={{
				width: "100%",
				height: "100%",
			}}
		>
			<Map user={user} />
		</div>
	);
};

export default MapContainer;
