import { useState, useEffect } from "react";
import { useHandleSocketEvents } from "./useHandleSocketEvents";
import { MOVEMENT } from "socket-events";
import { useSession } from "next-auth/react";
import { User } from "@/types/user";

export const useGeolocation = (user: User) => {
	const { data } = useSession();
	const [currentLocation, setCurrentLocation] = useState<{
		lng: number;
		lat: number;
	}>();

	const { socket } = useHandleSocketEvents();

	useEffect(() => {
		if (!socket || !currentLocation) return;
		socket.send(
			JSON.stringify({
				type: "set-interests-and-location",
				payload: {
					interests: user.interests,
					location: currentLocation,
				},
			})
		);
	}, []);

	useEffect(() => {
		if (!("geolocation" in navigator)) {
			alert("Geolocation is not supported by your browser.");
		}
		if (!data || !data.user) {
			console.log("User data is not available");
			return;
		}
		const watchId = navigator.geolocation.watchPosition(
			(position) => {
				console.log(position);
				//TODO: GET USER AROUND YOU,
				// FOR OPTIMIZATION ONLY GET USERS WHEN YOUR LOCATION CHANGES
				// BY CERTAIN METERS
				setCurrentLocation({
					lng: position.coords.longitude,
					lat: position.coords.latitude,
				});
				if (socket && currentLocation) {
					socket.send(
						JSON.stringify({
							type: MOVEMENT,
							payload: {
								location: {
									longitude: currentLocation.lng,
									latitude: currentLocation.lat,
								},
							},
						})
					);
				}
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
	return { currentLocation, data };
};
