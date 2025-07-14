import { User } from "./user";

export class Chat {
	public chatId: string;
	public admin: User;
	private participants: Set<User>;
	public currentParticipantsInCall: Set<User>;
	private producers: Map<string, string[]>;
	producersConsumedUsers: Set<string>;
	constructor(chatId: string, admin: User) {
		this.chatId = chatId;
		this.admin = admin;
		this.participants = new Set();
		this.currentParticipantsInCall = new Set();
		this.producers = new Map();
		this.producersConsumedUsers = new Set();
	}
	addProducer({ userId, producerId }: { userId: string; producerId: string }) {
		if (!this.producers.has(userId)) {
			this.producers.set(userId, []);
		}
		this.producers.get(userId)!.push(producerId);
	}

	getProducers(): { userId: string; producerId: string }[] {
		const result = [];
		for (const [userId, producerIds] of this.producers) {
			for (const producerId of producerIds) {
				result.push({ userId, producerId });
			}
		}
		return result;
	}

	addParticipantInCall(user: User) {
		this.currentParticipantsInCall.add(user);
	}
	getParticipants() {
		return this.participants;
	}
	removeParticipantFromCall(user: User) {
		this.currentParticipantsInCall.delete(user);
		this.producers.delete(user.getUserId());
		this.producersConsumedUsers.delete(user.getUserId());

		if (this.currentParticipantsInCall.values.length < 2) {
			this.currentParticipantsInCall = new Set();
		}
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
	broadcastInCall(payload: string, senderUserId?: string) {
		this.currentParticipantsInCall.forEach((participant) => {
			const participantUserId = participant.getUserId();
			if (senderUserId && participantUserId === senderUserId) {
				return;
			}

			participant.getSocket().send(payload);
		});
	}
}

class ChatManager {
	private static instance: ChatManager | undefined;
	private chats: Map<string, Chat>;
	public userChatMapping: Map<string, string[]>;
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
		this.userChatMapping.set(adminId, [chatId]);
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
		const chatsId = this.userChatMapping.get(userId);
		if (chatsId && chatsId.length > 0) {
			for (let i = 0; i < chatsId.length; i++) {
				const chatId = chatsId[i];
				const chat = this.getChat(chatId!);
				if (chat) {
					const participants = chat.getParticipants();
					chat.removeParticipantFromCall(user);
					if (participants.values.length === 0) {
						this.deleteChat(chat.chatId);
					}
				}
			}
		}
		this.userChatMapping.delete(userId);
	}
}

export const chatManager = ChatManager.getInstance();
