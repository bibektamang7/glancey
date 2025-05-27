import * as mediasoup from "mediasoup";
import { Peer } from "./peer";

export class Room {
	id: string;
	router: mediasoup.types.Router;
	peers: Map<string, Peer>;

	constructor(id: string, router: mediasoup.types.Router) {
		this.id = id;
		this.router = router;
		this.peers = new Map();
	}

	addPeer(peer: Peer) {
		this.peers.set(peer.id, peer);
	}

	removePeer(peerId: string) {
		this.peers.delete(peerId);
	}

	getPeer(peerId: string) {
		return this.peers.get(peerId);
	}

	getAllPeers() {
		return Array.from(this.peers.values());
	}

	close() {
		this.peers.clear();
	}
}
