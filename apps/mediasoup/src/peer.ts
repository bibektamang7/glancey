import * as mediasoup from "mediasoup";

export class Peer {
	id: string;
	transports: Map<string, mediasoup.types.Transport>;
	producers: Map<string, mediasoup.types.Producer>;
	consumers: Map<string, mediasoup.types.Consumer>;

	constructor(id: string, socket: any) {
		this.id = id;
		this.transports = new Map();
		this.producers = new Map();
		this.consumers = new Map();
	}

	addTransport(transport: mediasoup.types.Transport) {
		this.transports.set(transport.id, transport);
	}

	addProducer(producer: mediasoup.types.Producer) {
		this.producers.set(producer.id, producer);
	}

	addConsumer(consumer: mediasoup.types.Consumer) {
		this.consumers.set(consumer.id, consumer);
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
