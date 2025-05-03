import type { ServerWebSocket, WebSocket } from "bun";
import type { SocketData } from ".";

export class User {
	private userId: string;
	private socket: ServerWebSocket<SocketData>;
	private longitude?: number;
	private latitude?: number;

	constructor(userId: string, socket: ServerWebSocket<SocketData>) {
		this.userId = userId;
		this.socket = socket;
	}
	getUserId() {
		return this.userId;
	}

	getSocket() {
		return this.socket;
	}
	getLongitude() {
		return this.longitude;
	}
	getLatitude() {
		return this.latitude;
	}
	setLongitude(longitude: number) {
		this.longitude = longitude;
	}
	setLatitude(latitude: number) {
		this.latitude = latitude;
	}
}

class UserManager {
	private static instance: UserManager;
	onlineUsers: Set<User>;
	constructor() {
		this.onlineUsers = new Set();
	}
	static getInstance() {
		if (UserManager.instance) {
			return UserManager.instance;
		}
		UserManager.instance = new UserManager();
		return UserManager.instance;
	}
	setUser(user: User) {
		this.onlineUsers.add(user);
	}
	getUser(userId: string) {
		this.onlineUsers.forEach((user) => {
			const id = user.getUserId();
			if (userId === id) return user;
		});
		return null;
	}
}

export const userManager = UserManager.getInstance();
