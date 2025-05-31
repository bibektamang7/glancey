import { memo, useCallback, useState } from "react";
import {
	MapContainer,
	TileLayer,
	Marker,
	useMap,
	ZoomControl,
} from "react-leaflet";
import { Icon, LatLngLiteral } from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
type MapType = "roadmap" | "hybrid";

type MapLocation = LatLngLiteral & { id: string };

type MapProps = {
	center: LatLngLiteral;
	locations: MapLocation[];
};

const SelectedLocation = ({ center }: { center: LatLngLiteral }) => {
	const map = useMap();
	map.panTo(center, { animate: true });
	return null;
};

export const Map: React.FC<MapProps> = memo(({ center, locations }) => {
	const [mapType, setMapType] = useState<MapType>("roadmap");
	const [selectedLocation, setSelectedLocation] = useState<
		MapLocation | undefined
	>();

	const getUrl = useCallback(() => {
		const mapTypeUrls: Record<MapType, string> = {
			roadmap: "http://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}",
			hybrid: "http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}",
		};
		return mapTypeUrls[mapType];
	}, [mapType]);

	return (
		<>
			<div
				style={{
					width: "100%",
					height: "100%",
					borderRadius: "20px",
					overflow: "hidden",
				}}
			>
				<MapContainer
					center={center}
					zoom={30}
					minZoom={5}
					zoomControl={false}
					attributionControl={false}
					style={{ width: "100%", height: "100%" }}
				>
					<TileLayer url={getUrl()} />
					{selectedLocation && <SelectedLocation center={selectedLocation} />}
				</MapContainer>
			</div>
			<div style={{ display: "flex", marginTop: "10px", gap: "20px" }}>
				<button onClick={() => setMapType("roadmap")}>roadmap</button>
				<button onClick={() => setMapType("hybrid")}>hybrid</button>
			</div>
		</>
	);
});
