import { NextRequest, NextResponse } from "next/server";
import { auth } from "./app/api/auth/[...nextauth]/auth";

async function middleware(req: NextRequest) {
	const session = await auth();
	const path = req.nextUrl.pathname;

	const isPublicPath = path === "/" || path === "/login" || path === "/signup";

	if (isPublicPath && session) {
		return NextResponse.redirect(new URL("/map", req.url));
	}

	if (!isPublicPath && !session) {
		return NextResponse.redirect(new URL("/login", req.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/login", "/signup", "/map", "/c/:path*", "/notifications"],
};

export default middleware;
