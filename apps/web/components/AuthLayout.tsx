"use client";
import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import LoaderComponent from "./Loader";
import { useRouter } from "next/navigation";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
	const router = useRouter();
	const { status } = useSession();

	useEffect(() => {
		if (status === "unauthenticated") {
			router.push("/login");
		}
	}, [status, router]);

	if (status === "loading") {
		return <LoaderComponent />;
	}

	if (status === "authenticated") {
		return <>{children}</>;
	}

	return null;
};

export default AuthLayout;
