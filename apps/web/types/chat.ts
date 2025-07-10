import { User } from "./user";

export interface Chat {
	id: string;
	messages: Message[];
	participants: User[];
	name: string;
	lastMessage: Message;
}

export interface Message {
	id: string;
	sender: User;
	content: string;
	createdAt: Date;
}
