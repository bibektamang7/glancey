/* 
	// THIS IS ON RTPCAPABILITIES
	try {
		device = new mediasoup.Device()
	}catch(error) {
		if(error.name === "UnsupportedError") {
			console.log("browser not supported")
		}
	}
	await device.load(rtpCapabilities)


*/

/*
	// CREATE_PRODUCER_TRANSPORT

	message = {
		type: 'createProducerTransport',
		forceTcp: false,
		rtpCapabilities: device.rtpCapabilities
	}

	// ON MESSAGE RETURN
	i.e ProducerTransportCreated
	
	if(event.error) {
		console.error("producer transport create error")
	}
	const transport = device.createSendTransport(event.data) //params
	transport.on('connect', async ({dtlsParameters}, callback, errback) => {
		const message = {
			'type': 'connectProducerTransport',
			transportId: event.payload.id,
			dtlsParameters
		}	
		cosnt resp = JSON.stringfy(message)
		socket.send(resp)
		socket.addEventListener('message', (event) => {
			if(event.type === 'producerConnected') {
				callback()
			}
		})
	})
		//begin transport on produce
	transport.on('produce', async({kind, rtpParameters}, callback, errback) => {
		const msg = {
			type: "produce",
			transportId: transport.id,
			kind,
			rtpParameters
		}
		socket.send(msg)
		socket.addEventListener('message', (res) => {
			if(res.type === 'produced') {
				callback(res.data.id)
			}
		})
	})
	// end transport producer

	//connection state change begin 
	transport.on('connectionStateChange', (state) => {
		switch(state) {
			case 'connecting':
			case 'connected':
			case 'failed':
				transport.close()

		}	
	})
	//connection state change end
	let stream;
	try catch  here

	stream = await getUserMedia(transport, isWebcam)
	const track = stream.getVideoTracks()[0]
	const params = {track}
	producer = await transport.producer(params)

	//on error
	console.error(error)


*/

/*
	const getUserMedia = async (transport, isWebcam) => {
	if(!device.canProduce('video'))} {
		console.error('cannot produce video')
		return
	}
	let stream;
	try {
		stream = isWebcam ? await navigator.mediaDevices.getUserMedia({video:true, audio: true}) : await navigator.mediaDevices.getUserMedia({video: true})
	}catch(error) {
		console.error(error)
		throw error;
	}
	return stream
*/

// THIS IS CONSUMER CODES

/*
	const msg = {
		type: "createConsumerTransport",
		forceTcp: false,
	}

	socket.send(msg)

	// on subTransportCreated
	if(event.error) {
		console.error('on subtransport create error')
		return	
	}

	const transport = device.createRecvTransport(event.data)

	transport.on('connect', ({dtlsParameters}, callback, errback) => {
		const msg = {
			type: 'connectConsumerTransport',
			transpordId: transport.id,
			dtlsParameters
		}
		socket.send(msg)
		socket.addEventListener('message', async(event) => {
			if(event.type === 'subConnected') {
				console.log("consumer transport connected")
				callback()
			}
		})
	})
	
	transport.on('connectionstatechange', async(state) => {
		switch(state) {
			case 'connecting':
			case 'connected':
				remoteVideo.srcObject = remoteStream;
				const msg = {
					type: 'resume',
				}
				socket.send(msg)
			case 'failed':
				transport.close()
		}
	})

	const stream = consumer(transport);
*/

/*
	const consume = async(transport) => {
		const {rtpCapabilities} = device;
		const msg = {
			type: 'consume',
			rtpCapabilities
		}	
		socket.send(msg)
	}
*/

/*
	// on resumed

*/

/*
	//on subscribed

	cosnt {
		producerId,
		id,
		kind,
		rtpParameters,
	} = event.data
	
	let condecOption = {}
	const consumer = await consumeTransport.connect({
		id,
		producerId,
		kind,
		rtpParameters,
		codecOptions,
	})
	
	const stram = new MediaStream()
	stream.addTrack(consumer.track)

	remoteStream = stream;
*/
