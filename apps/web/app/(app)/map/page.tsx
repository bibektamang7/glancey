"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const Map = dynamic(
	() =>
		import("../../../components/map/Map").then((component) => component.Map),
	{
		ssr: false,
	}
);

const HomePage = () => {
	const [currentLocation, setCurrentLocation] = useState<{
		longitude: number;
		latitude: number;
	}>();
	//TODO: Location of active user
	const locations = [
		{ id: "550e8400-e29b-41d4-a716-446655440000", lat: 51.5074, lng: -0.1278 },
	];

	useEffect(() => {
		window.navigator.geolocation.getCurrentPosition((position) => {
			setCurrentLocation({
				longitude: position.coords.longitude,
				latitude: position.coords.latitude,
			});
		});

	}, []);

	if (!currentLocation) {
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
					lng: currentLocation?.longitude!,
					lat: currentLocation?.latitude!,
				}}
				locations={locations}
			/>
		</div>
	);
};

export default HomePage;
