import * as mediasoup from "mediasoup";

export class Peer {
	id: string;
	transports: Map<string, mediasoup.types.Transport>;
	producers: Map<string, mediasoup.types.Producer>;
	consumers: Map<string, mediasoup.types.Consumer>;

	constructor(id: string) {
		this.id = id;
		this.transports = new Map();
		this.producers = new Map();
		this.consumers = new Map();
	}

	addTransport(transport: mediasoup.types.Transport) {
		this.transports.set(transport.id, transport);
	}
	getTransport(transportId: string) {
		return this.transports.get(transportId);
	}

	addProducer(producer: mediasoup.types.Producer) {
		this.producers.set(producer.id, producer);
	}
	getProducer(producerId: string) {
		return this.producers.get(producerId);
	}

	addConsumer(consumer: mediasoup.types.Consumer) {
		this.consumers.set(consumer.id, consumer);
	}
	getConsumer(consumerId: string) {
		return this.consumers.get(consumerId);
	}

	removeTransport(transportId: string) {
		const transport = this.transports.get(transportId);
		if (transport) {
			transport.close();
			this.transports.delete(transportId);
		}
	}

	removeProducer(producerId: string) {
		const producer = this.producers.get(producerId);
		if (producer) {
			producer.close();
			this.producers.delete(producerId);
		}
	}

	removeConsumer(consumerId: string) {
		const consumer = this.consumers.get(consumerId);
		if (consumer) {
			consumer.close();
			this.consumers.delete(consumerId);
		}
	}

	close() {
		this.transports.forEach((transport) => transport.close());
		this.producers.forEach((producer) => producer.close());
		this.consumers.forEach((consumer) => consumer.close());
		this.transports.clear();
		this.producers.clear();
		this.consumers.clear();
	}
}
