import { memo, useCallback, useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L, { LatLngLiteral } from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import { createGoogleMapsMarker } from "@/helpers/customMarker";
import { useGeolocation } from "@/hooks/useGeolocation";
import LoaderComponent from "../Loader";
import { User } from "@/types/user";

type MapType = "roadmap" | "hybrid";

export const Map: React.FC<{ user: User }> = ({ user }) => {
	// const { currentLocation, data } = useGeolocation(user);

	const [mapType, setMapType] = useState<MapType>("roadmap");

	const getUrl = useCallback(() => {
		const mapTypeUrls: Record<MapType, string> = {
			roadmap: "http://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}",
			hybrid: "http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}",
		};
		return mapTypeUrls[mapType];
	}, [mapType]);

	// if (!currentLocation || !data || !data.user) {
	// 	return <LoaderComponent />;
	// }

	return (
		<div
			style={{
				width: "100%",
				height: "100%",
				overflow: "hidden",
				position: "relative",
			}}
		>
			<MapContainer
				center={{ lat: 40, lng: 50 }}
				zoom={30}
				minZoom={5}
				zoomControl={false}
				attributionControl={false}
				style={{ width: "100%", height: "100%" }}
				doubleClickZoom={false}
			>
				<TileLayer url={getUrl()} />
				{/* <CustomMarker center={currentLocation} /> */}
			</MapContainer>
		</div>
	);
};

const CustomMarker = ({ center }: { center: LatLngLiteral }) => {
	const initialIcon = L.divIcon({
		className: "marker",
		html: createGoogleMapsMarker({
			isActive: true,
		}),
	});

	return (
		<Marker
			position={center}
			icon={initialIcon}
			zIndexOffset={1000}
		>
			<Popup className="">This is popup to display user info</Popup>
		</Marker>
	);
};

// <div style={{ display: "flex", marginTop: "10px", gap: "20px" }}>
// 	<button onClick={() => setMapType("roadmap")}>roadmap</button>
// 	<button onClick={() => setMapType("hybrid")}>hybrid</button>
// </div>
