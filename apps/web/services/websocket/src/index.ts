//bun websocket
Bun.serve({
	fetch(req, server) {
		server.upgrade(req);
	},
	websocket: {
		open() {},
		message(ws, message) {},
		close() {},
		perMessageDeflate: true,
	},
});
