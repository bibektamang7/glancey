import { toast } from "sonner";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";
export const handleSetInterestsApi = async (interests: string[]) => {
	try {
		const response = await fetch(`${BACKEND_URL}/api/v1/set-interests`, {
			body: JSON.stringify({ interests }),
			method: "POST",
		});
		if (!response.ok) {
			toast("Try again.");
		}
		return response.json();
	} catch (error) {
		console.log("failed to set interests", error);
		toast("Failed to set, try again.");
	}
};
