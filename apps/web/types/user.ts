export enum Interest {
	TikTok = "TikTok",
	Video_Gaming = "Video_Gaming",
	Travel = "Travel",
	Gardening = "Gardening",
	Sports = "Sports",
	Outdoor_Activity = "Outdoor_Activity",
	Arts_and_crafts = "Arts_and_Crafts",
	Cooking = "Cooking",
	Reading = "Reading",
	Running = "Running",
	Technology = "Technology",
	Other = "Other",
}

export interface User {
	id: string;
	name: string;
	email: string;
	image: string;
	interests: string[];
	aboutMe: string | null;
	createdAt: Date;
	profession: string | null;
}
