//bun websocket

const server = Bun.serve({
	port: 8080,
	fetch(req, server) {
		const success = server.upgrade(req);
		if (success) {
			return undefined;
		}
		return new Response("Hello world");
	},
	websocket: {
		open() {},
		message(ws, message) {},
		close() {},
		perMessageDeflate: true,
	},
});

console.log(`Listening on ${server.hostname}:${server.port}`);
