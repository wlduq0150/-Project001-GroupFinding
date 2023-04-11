const SocketIO =  require("socket.io");
const cookieParser = require("cookie-parser");

module.exports = (server, app, sessionMiddleware) => {
	const io = SocketIO(server, { path: "/socket.io" });
	app.set("io", io);
	const chat = io.of("chat");
	const position = io.of("position");
	
	io.use((socket, next) => {
		cookieParser(process.env.COOKIE_SECRET)(socket.request, socket.request.res || {}, next);
		sessionMiddleware(socket.request, socket.request.res || {}, next);
	});
	
	chat.on("connection", (socket) => {
		console.log("chat네임스페이스 접속.");
		
		socket.on("disconnect", () => {
			console.log("chat네임스페이스 접속해제.");
		});
	});
	
	position.on("connection", (socket) => {
		console.log("position네임스페이스 접속.");
		socket.emit("newCreate");
		
		socket.on("disconnect", () => {
			console.log("position네임스페이스 접속해제.");
			
		});
	})
}