"use client";
import dynamic from "next/dynamic";
import LoaderComponent from "@/components/Loader";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useUserAround } from "@/hooks/useUserAround";

const Map = dynamic(
	() => import("@/components/map/Map").then((component) => component.Map),
	{
		ssr: false,
	}
);

const MapPage = () => {
	const { currentLocation } = useGeolocation();
	const { locations } = useUserAround();
	if (!currentLocation) {
		return <LoaderComponent />;
	}

	return (
		<div
			style={{
				width: "100vw",
				height: "100vh",
			}}
		>
			<Map
				center={{
					lng: currentLocation.longitude,
					lat: currentLocation.latitude,
				}}
				locations={locations}
			/>
		</div>
	);
};

export default MapPage;
