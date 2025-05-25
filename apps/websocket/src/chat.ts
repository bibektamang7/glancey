import { User } from "./user";

class Chat {
	public chatId: string;
	private participants: Set<User>;
	constructor(chatId: string) {
		this.chatId = chatId;
		this.participants = new Set();
	}
	addParticipant(user: User) {
		this.participants.add(user);
	}
	removeParticipant(user: User) {
		this.participants.delete(user);
	}
}
class ChatManager {
	private static instance: ChatManager | undefined;
	private chats: Map<string, Chat>;
	constructor() {
		this.chats = new Map();
	}
	static getInstance() {
		if (this.instance) return this.instance;
		this.instance = new ChatManager();
		return this.instance;
	}
	getChats(chatId: string) {
		return this.chats.get(chatId);
	}
	deleteChat(chatId: string) {
		this.chats.delete(chatId);
		// TODO: Delete necessary data from redis if any
	}
}

export const chatManager = ChatManager.getInstance();
