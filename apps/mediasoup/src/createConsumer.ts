import type {
	Producer,
	Router,
	RtpCapabilities,
	Transport,
} from "mediasoup/types";

const createConsumer = async (
	router: Router,
	producer: Producer,
	rtpCapabilities: RtpCapabilities,
	consumerTransport: Transport
) => {
	if (
		!router.canConsume({
			producerId: producer.id,
			rtpCapabilities,
		})
	) {
		console.error("cannot consume");
		return;
	}
	try {
		const consumer = await consumerTransport.consume({
			producerId: producer.id,
			rtpCapabilities,
			paused: producer.kind === "video",
		});

		return consumer;
	} catch (error) {
		console.error("consume failed: ", error);
	}
};

// return {
// 	producerId: producer.id,
// 	id: createConsumer.bind,
// 	kind: consumer.kind,
// 	rtpParameteres: consumer.rtpParameters,
// 	type:consumer.type,
// 	producerPaused: consumer.producerPauser
// }