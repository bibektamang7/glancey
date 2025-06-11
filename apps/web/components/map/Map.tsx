import { memo, useCallback, useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L, { LatLngLiteral } from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import { AvatarLogo, createGoogleMapsMarker } from "@/helpers/customMarker";
import { useGeolocation } from "@/hooks/useGeolocation";
import LoaderComponent from "../Loader";
import { User } from "@/types/user";
import { NearerUser } from "@/hooks/useHandleSocketEvents";
import { Avatar } from "../ui/avatar";
import { AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { Button } from "../ui/button";
import MapChat from "../chat/MapChat";

type MapType = "roadmap" | "hybrid";

export const Map: React.FC<{ user: User }> = ({ user }) => {
	const { currentLocation, data, nearUsers } = useGeolocation(user);

	const [mapType, setMapType] = useState<MapType>("roadmap");

	const getUrl = useCallback(() => {
		const mapTypeUrls: Record<MapType, string> = {
			roadmap: "http://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}",
			hybrid: "http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}",
		};
		return mapTypeUrls[mapType];
	}, [mapType]);

	if (!currentLocation || !data || !data.user) {
		return <LoaderComponent />;
	}

	return (
		<div
			className="z-10"
			style={{
				width: "100%",
				height: "100%",
				overflow: "hidden",
				position: "relative",
			}}
		>
			<MapContainer
				center={currentLocation}
				zoom={30}
				minZoom={5}
				zoomControl={false}
				attributionControl={false}
				style={{ width: "100%", height: "100%" }}
				doubleClickZoom={false}
			>
				<TileLayer url={getUrl()} />
				<CustomMarker center={currentLocation} />
				{nearUsers.length > 0 &&
					nearUsers.map((user) => (
						<NearUserMarker
							key={user.id}
							user={user}
						/>
					))}
			</MapContainer>
		</div>
	);
};

const NearUserMarker = ({ user }: { user: NearerUser }) => {
	const [isChatOpen, setIsChatOpen] = useState(false);
	const handleChatOpen = () => {
		setIsChatOpen(true);
	};
	const handleChatClose = () => {
		setIsChatOpen(false);
	};
	const initialIcon = L.divIcon({
		className: "nearUserMarker",
		html: AvatarLogo({
			image: user.image,
			name: user.name,
			size: 35,
		}),
	});
	return (
		<>
			{isChatOpen && (
				<MapChat
					user={user}
					handleCloseChat={handleChatClose}
				/>
			)}
			<Marker
				position={{ lat: user.location.latitude, lng: user.location.longitude }}
				icon={initialIcon}
				zIndexOffset={1000}
			>
				<Popup>
					<div>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Avatar>
									<AvatarImage src={user.image} />
									<AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
								</Avatar>
								<span className="text-sm font-semibold">{user.name}</span>
							</div>
							<Button
								className="!px-2 text-xs"
								onClick={handleChatOpen}
							>
								Chat
							</Button>
						</div>
						<div className="flex items-center gap-2 !mt-2">
							{user.interests.length > 0 &&
								user.interests.map((interest) => (
									<span
										key={interest}
										className="border-2 rounded-md !p-2 text-sm tracking-tight font-semibold"
									>
										{interest}
									</span>
								))}
						</div>
					</div>
				</Popup>
			</Marker>
		</>
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
