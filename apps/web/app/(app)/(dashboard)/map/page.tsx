import MapContainer from "@/pages/Map/MapContainer";
import { prismaClient } from "db";
import { auth } from "@/app/api/auth/[...nextauth]/auth";

const MapPage = async () => {
	const session = await auth();
	// TODO: NOT IDEAL SOLUTION
	if (!session || !session.user) {
		return;
	}
	const user = await prismaClient.user.findUnique({
		where: {
			id: session.user.id,
		},
	});
	//TODO: handle properly
	if (!user) {
		return;
	}
	return <MapContainer user={user} />;
};

export default MapPage;
