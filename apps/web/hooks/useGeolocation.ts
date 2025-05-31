import { useState, useEffect } from "react";

export const useGeolocation = () => {
	const [currentLocation, setCurrentLocation] = useState<{
		longitude: number;
		latitude: number;
	}>();

	useEffect(() => {
		if (!("geolocation" in navigator)) {
			alert("Geolocation is not supported by your browser.");
		}
		const watchId = navigator.geolocation.watchPosition(
			(position) => {
				console.log(position);
				setCurrentLocation({
					longitude: position.coords.longitude,
					latitude: position.coords.latitude,
				});
			},
			(err: any) => {
				alert(`Geolocation error: ${err.message}`);
			},
			{ enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
		);
		return () => {
			navigator.geolocation.clearWatch(watchId);
		};
	}, []);
	return { currentLocation };
};
