import { prismaClient } from "db";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "../../auth/[...nextauth]/auth";

export async function POST(req: NextRequest) {
	try {
		const session = await auth();
		if (!session || !session.user) {
			return NextResponse.json(
				{ success: false, message: "Unauthorized access" },
				{ status: 403 }
			);
		}
		const requestData = await req.json();
		if (!requestData || !requestData.interests || requestData.interests < 1) {
			return NextResponse.json(
				{ success: false, message: "Interests not provided" },
				{ status: 400 }
			);
		}
		console.log("what abut somehting here", requestData.interests);
		await prismaClient.user.update({
			where: { id: session.user.id },
			data: {
				interests: requestData.interests,
			},
		});

		return NextResponse.json(
			{ success: true, message: "Interest set successfully." },
			{ status: 200 }
		);
	} catch (error) {
		console.log("This is error", error);
		return NextResponse.json(
			{ success: false, message: "Failed to set interests." },
			{ status: 500 }
		);
	}
}
