import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useHandleSocketEvents } from "./useHandleSocketEvents";
import { MOVEMENT, SET_INTERESTS_AND_LOCATION } from "socket-events";
import { User } from "@/types/user";

// Helper to calculate distance between two coordinates in meters
function getDistance(
	a: { lat: number; lng: number },
	b: { lat: number; lng: number }
) {
	const toRad = (value: number) => (value * Math.PI) / 180;
	const R = 6371e3; // Earth radius in meters

	const φ1 = toRad(a.lat);
	const φ2 = toRad(b.lat);
	const Δφ = toRad(b.lat - a.lat);
	const Δλ = toRad(b.lng - a.lng);

	const aVal =
		Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

	const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
	return R * c;
}

export const useGeolocation = (user: User) => {
	const { data } = useSession();
	const { socket } = useHandleSocketEvents();
	const [location, setLocation] = useState<{ lng: number; lat: number }>();
	const sentInitial = useRef(false);
	const lastLocation = useRef<{ lng: number; lat: number }>(location);

	useEffect(() => {
		if (!navigator.geolocation || !socket || !data?.user) return;

		const { id: sender } = data.user;
		const interests = user.interests;

		const watchId = navigator.geolocation.watchPosition(
			({ coords }) => {
				const newLoc = { lng: coords.longitude, lat: coords.latitude };

				// Send initial interests + location once
				if (!sentInitial.current) {
					socket.send(
						JSON.stringify({
							type: SET_INTERESTS_AND_LOCATION,
							payload: { sender, interests, location: newLoc },
						})
					);
					sentInitial.current = true;
					lastLocation.current = newLoc;
					setLocation(newLoc);
					return;
				}

				// Only send MOVEMENT if user has moved >10 meters
				if (lastLocation.current) {
					const distance = getDistance(lastLocation.current, newLoc);
					if (distance < 10) return; // Ignore small movements
				}

				lastLocation.current = newLoc;
				setLocation(newLoc);

				socket.send(
					JSON.stringify({
						type: MOVEMENT,
						payload: {
							location: { longitude: newLoc.lng, latitude: newLoc.lat },
						},
					})
				);
			},
			(err) => alert(`Geolocation error: ${err.message}`),
			{ enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
		);

		return () => navigator.geolocation.clearWatch(watchId);
	}, [socket, data, user.interests]);

	return { currentLocation: location, data };
};
