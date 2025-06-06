import type { ServerWebSocket } from "bun";
import type { SocketData } from ".";
import { createClient } from "redis-config";
import { USER_MOVEMENT, USERS_NEAR_YOU } from "socket-events";

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
	name: string;
	image: string;
}

interface UserLocation {
	longitude: number;
	latitude: number;
}

export class User {
	public userId: string;
	private socket: ServerWebSocket<SocketData>;
	public username: string;
	private location?: UserLocation;
	private image: string;
	public interests: string[];

	constructor(
		userId: string,
		socket: ServerWebSocket<SocketData>,
		image: string,
		username: string
	) {
		this.userId = userId;
		this.socket = socket;
		this.image = image;
		this.interests = [];
		this.username = username;
	}
	setInterests(interests: string[]) {
		this.interests.push(...interests);
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
			const membersSocket = userManager.getAllUsers(members);
			//TODO: ASSUMING members HOLDS MEMBER VALUE STORED ON GEO_ADD
			membersSocket.forEach((member) => {
				member.getSocket().send(
					JSON.stringify({
						type: USER_MOVEMENT,
						payload: {
							user: {
								id: this.userId,
								username: this.username,
								image: this.image,
								interests: this.interests,
								location: this.location,
							},
						},
					})
				);
			});
			const usersInfo = extractUserInfo(membersSocket);
			this.socket.send(
				JSON.stringify({
					type: USERS_NEAR_YOU,
					payload: {
						aroundUsers: usersInfo,
					},
				})
			);
		} catch (error) {
			console.error("Couldn't update location of user", error);
		}
	}
}

interface UserInfo {
	id: string;
	image: string;
	username: string;
	interests: string[];
	location: UserLocation | undefined;
}

const extractUserInfo = (users: User[]) => {
	const infos = users.reduce((acc: UserInfo[], currentUser) => {
		const info = {
			id: currentUser.userId,
			username: currentUser.username,
			image: currentUser.getImage(),
			interests: currentUser.interests,
			location: currentUser.getLocation(),
		};
		acc.push(info);
		return acc;
	}, []);
	return infos;
};

class UserManager {
	private static instance: UserManager;
	onlineUsers: Map<string, User>;
	constructor() {
		this.onlineUsers = new Map();
	}
	static getInstance() {
		if (UserManager.instance) {
			return UserManager.instance;
		}
		UserManager.instance = new UserManager();
		return UserManager.instance;
	}
	async addUser(user: User) {
		const userId = user.getUserId();
		this.onlineUsers.set(userId, user);
		// try {
		// 	await redisClient.geoAdd(`users:location`, {
		// 		longitude: location.longitude,
		// 		latitude: location.latitude,
		// 		member: `user:${userId}`,
		// 	});
		// } catch (error) {
		// 	console.log("couldn't add user in redis", error);
		// }
	}
	getUser(userId: string): User | null {
		this.onlineUsers.forEach((user) => {
			const id = user.getUserId();
			if (userId === id) return user;
		});
		return null;
	}
	async removeUser(user: User) {
		const userId = user.getUserId();
		this.onlineUsers.delete(userId);
		try {
			await redisClient.zRem("users:location", `user:${userId}`);
		} catch (error) {
			console.log("Failed to remove user from redis", error);
		}
		//TODO: REMOVE FROM REDIS AS WELL
	}
	getAllUsers(users: string[]) {
		return users.reduce((acc: User[], currentUser) => {
			const userId = currentUser.split(":")[1];
			if (!userId) return acc;
			const user = this.onlineUsers.get(userId);
			if (user) {
				acc.push(user);
			}
			return acc;
		}, []);
	}
}

export const userManager = UserManager.getInstance();
