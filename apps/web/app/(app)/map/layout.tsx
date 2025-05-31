import React from "react";

const MapLayout = ({ children }: { children: React.ReactNode }) => {
	return <main className="w-screen h-screen">{children}</main>;
};

export default MapLayout;
