import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	MapContainer,
	TileLayer,
	Marker,
	useMapEvents,
} from "react-leaflet";
import L, { LatLngExpression, LatLngLiteral } from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import { createIndriverMarkerSVG } from "@/helpers/customMarker";

type MapType = "roadmap" | "hybrid";

type MapLocation = LatLngLiteral & { id: string };

type MapProps = {
	center: LatLngLiteral;
	locations: MapLocation[];
};

export const Map: React.FC<MapProps> = memo(({ center, locations }) => {
	const [mapType, setMapType] = useState<MapType>("roadmap");

	const getUrl = useCallback(() => {
		const mapTypeUrls: Record<MapType, string> = {
			roadmap: "http://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}",
			hybrid: "http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}",
		};
		return mapTypeUrls[mapType];
	}, [mapType]);

	return (
		<div
			style={{
				width: "100%",
				height: "100%",
				borderRadius: "20px",
				overflow: "hidden",
				position: "relative",
			}}
		>
			<div
				style={{
					position: "absolute",
					top: "80px",
					left: "50%",
					transform: "translateX(-50%)",
					zIndex: 1000,
					background: "rgba(0,0,0,0.7)",
					color: "white",
					padding: "8px 16px",
					borderRadius: "15px",
					fontSize: "12px",
					textAlign: "center",
				}}
			>
				Move the map to position the marker at your pickup location
			</div>
			<MapContainer
				center={center}
				zoom={30}
				minZoom={5}
				zoomControl={false}
				attributionControl={false}
				style={{ width: "100%", height: "100%" }}
				doubleClickZoom={false}
			>
				<TileLayer url={getUrl()} />
				<IndriverCenterMarker
					center={center}
					color="#FF6B35"
				/>
			</MapContainer>
		</div>
	);
});


function IndriverCenterMarker({
	color = "#FF6B35",
	center,
}: {
	color: string;
	center: LatLngLiteral;
}) {
	const [position, setPosition] = useState<LatLngExpression>([
		center.lat,
		center.lng,
	]);
	const [isMoving, setIsMoving] = useState(false);
	const [isSettling, setIsSettling] = useState(false);
	const markerRef = useRef<L.Marker<any>>(null);
	const settleTimeoutRef = useRef<NodeJS.Timeout>(null);

	const map = useMapEvents({
		movestart() {
			setIsMoving(true);
			if (settleTimeoutRef.current) {
				clearTimeout(settleTimeoutRef.current);
				setIsSettling(false);
			}
		},
		move() {
			const center = map.getCenter();
			setPosition([center.lat, center.lng]);
		},
		moveend() {
			setIsMoving(false);
			settleTimeoutRef.current = setTimeout(() => {
				setIsSettling(true);
				setTimeout(() => setIsSettling(false), 600);
			}, 100);
		},
	});

	useEffect(() => {
		if (markerRef.current) {
			const marker = markerRef.current;
			const newIcon = L.divIcon({
				className: "indriver-marker",
				html: createIndriverMarkerSVG(60, color, isMoving || isSettling),
				iconSize: [60, 72],
				iconAnchor: [30, 60],
			});
			marker.setIcon(newIcon);
		}
	}, [isMoving, isSettling, color]);

	const initialIcon = L.divIcon({
		className: "indriver-marker",
		html: createIndriverMarkerSVG(60, color, false),
		iconSize: [60, 72],
		iconAnchor: [30, 60],
	});

	return (
		<Marker
			ref={markerRef}
			position={position}
			icon={initialIcon}
			zIndexOffset={1000}
		/>
	);
}

// <div style={{ display: "flex", marginTop: "10px", gap: "20px" }}>
// 	<button onClick={() => setMapType("roadmap")}>roadmap</button>
// 	<button onClick={() => setMapType("hybrid")}>hybrid</button>
// </div>
