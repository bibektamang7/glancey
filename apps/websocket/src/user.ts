import type { ServerWebSocket } from "bun";
import type { SocketData } from ".";
import { createClient } from "redis-config";

const redisClient = createClient();

(async () => {
	await redisClient
		.on("error", (err) => {
			console.error("Failed to connect redis client", err);
		})
		.connect();
})();

export interface TUser {
	id: string;
	username: string;
	image: string;
	interests: string[];
}

interface UserLocation {
	longitude: number;
	latitude: number;
}

export class User {
	public userId: string;
	private socket: ServerWebSocket<SocketData>;
	public username: string;
	private location: UserLocation;
	private image: string;
	public interests: string[];

	constructor(
		userId: string,
		socket: ServerWebSocket<SocketData>,
		image: string,
		location: { longitude: number; latitude: number },
		interests: string[],
		username: string
	) {
		this.userId = userId;
		this.socket = socket;
		this.location = location;
		this.image = image;
		this.interests = interests;
		this.username = username;
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
			await redisClient.zRem("users:location", `user:${this.userId}`);
			await redisClient.geoAdd("users:location", {
				longitude: location.longitude,
				latitude: location.latitude,
				member: `user:${this.userId}`,
			});
			const members = await redisClient.geoSearch(
				"users:location",
				{ latitude: location.latitude, longitude: location.longitude },
				{ radius: 10, unit: "km" }
			);
			//TODO: ASSUMING members HOLDS MEMBER VALUE STORED ON GEO_ADD
			members.forEach((member) => {
				const userId = member.split(":")[1];
				console.log(userId, "this is online user in redius something");
				if (userId) {
					const socketUser = userManager.getUser(userId);
					if (socketUser) {
						socketUser.getSocket().send(
							JSON.stringify({
								type: "",
								payload: {},
							})
						);
					}
				}
			});
		} catch (error) {
			console.error("Couldn't update location of user", error);
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
			await redisClient.geoAdd(`users:location`, {
				longitude: location.longitude,
				latitude: location.latitude,
				member: `user:${userId}`,
			});
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
			await redisClient.zRem("users:location", `user:${userId}`);
		} catch (error) {
			console.log("Failed to remove user from redis", error);
		}
		//TODO: REMOVE FROM REDIS AS WELL
	}
}

export const userManager = UserManager.getInstance();
