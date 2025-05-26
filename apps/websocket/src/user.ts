import type { ServerWebSocket, WebSocket } from "bun";
import type { SocketData } from ".";
import { redisClient } from "redis-config";
import { chatManager } from "./chat";

export interface TUser {
	id: string;
	image: string;
	interests: string[];
}

interface UserLocation {
	longitude: number;
	latitude: number;
}

export class User {
	private userId: string;
	private socket: ServerWebSocket<SocketData>;
	private location: UserLocation;
	private image: string;
	public interests: string[];

	constructor(
		userId: string,
		socket: ServerWebSocket<SocketData>,
		image: string,
		location: { longitude: number; latitude: number },
		interests: string[]
	) {
		this.userId = userId;
		this.socket = socket;
		this.location = location;
		this.image = image;
		this.interests = interests;
	}
	getInterests() {
		return this.interests;
	}
	getImage() {
		return this.image;
	}
	getUserId() {
		return this.userId;
	}

	getSocket() {
		return this.socket;
	}
	getLocation() {
		return this.location;
	}
	async updateLocation(location: UserLocation) {
		this.location = location;
		try {
			await redisClient.zrem("users:location", `user:${this.userId}`);
			await redisClient.geoadd(
				"users:location",
				location.longitude,
				location.latitude,
				`user: ${this.userId}`
			);
		} catch (error) {
			console.log("Couldn't update location of user", error);
		}
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
	async addUser(user: User) {
		this.onlineUsers.add(user);
		//TODO:
		const location = user.getLocation();
		const userId = user.getUserId();
		// TODO: FUTURE UPDATES
		// RETRY MECHANISM IF FAILED TO ADD USER
		try {
			await redisClient.geoadd(
				`users:location`,
				location.longitude,
				location.latitude,
				`user:${userId}`
			);
		} catch (error) {
			console.log("couldn't add user in redis", error);
		}
	}
	getUser(userId: string): User | null {
		this.onlineUsers.forEach((user) => {
			const id = user.getUserId();
			if (userId === id) return user;
		});
		return null;
	}
	async removeUser(user: User) {
		this.onlineUsers.delete(user);
		const userId = user.getUserId();
		try {
			await redisClient.zrem("users:location", `user:${userId}`);
		} catch (error) {
			console.log("Failed to remove user from redis", error);
		}
		//TODO: REMOVE FROM REDIS AS WELL
	}
}

export const userManager = UserManager.getInstance();
