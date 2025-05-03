import type { WebSocket } from "bun";

export class User {
	private userId: string;
	private socket: WebSocket;
	private longitude: number;
	private latitude: number;

	constructor(
		userId: string,
		socket: WebSocket,
		longitude: number,
		latitude: number
	) {
		this.userId = userId;
		this.socket = socket;
		this.latitude = latitude;
		this.longitude = longitude;
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
