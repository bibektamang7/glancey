import { User } from "./user";

class Chat {
	public chatId: string;
	public admin: User;
	private participants: Set<User>;
	constructor(chatId: string, admin: User) {
		this.chatId = chatId;
		this.admin = admin;
		this.participants = new Set();
	}
	addParticipant(user: User) {
		this.participants.add(user);
	}
	removeParticipant(user: User) {
		this.participants.delete(user);
	}
	broadcastMessage(payload: string, senderUserId: string) {
		this.participants.forEach((participant) => {
			const participantUserId = participant.getUserId();
			if (participantUserId !== senderUserId) {
				participant.getSocket().send(payload);
			}
		});
	}
}

class ChatManager {
	private static instance: ChatManager | undefined;
	private chats: Map<string, Chat>;
	public userChatMapping: Map<string, string>;
	constructor() {
		this.chats = new Map();
		this.userChatMapping = new Map();
	}
	static getInstance() {
		if (ChatManager.instance) return ChatManager.instance;
		ChatManager.instance = new ChatManager();
		return ChatManager.instance;
	}
	createChat(chatId: string, admin: User) {
		const adminId = admin.getUserId();
		const chat = new Chat(chatId, admin);
		chat.addParticipant(admin);
		this.chats.set(chatId, chat);
		this.userChatMapping.set(adminId, chatId);
		return chat;
	}
	getChat(chatId: string) {
		return this.chats.get(chatId);
	}
	deleteChat(chatId: string) {
		this.chats.delete(chatId);
		// TODO: Delete necessary data from redis if any
	}
	addUserInChat(user: User) {
		const userId = user.getUserId();
	}
	removeUserFromChat(user: User) {
		const userId = user.getUserId();
		const chatId = this.userChatMapping.get(userId);
		if (chatId) {
			const chat = this.getChat(chatId);
			chat?.removeParticipant(user);
		}
	}
}

export const chatManager = ChatManager.getInstance();
