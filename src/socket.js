const SocketIO =  require("socket.io");
const axios = require('axios');
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
		
		socket.on("disconnect", async () => {
			console.log("chat네임스페이스 접속해제.");
			const req = socket.request;
			if (req.session.passport && req.session.passport.nick) {
				await axios.post("https://finding-group.run.goorm.site/group/suddenLeave", {
					nick: req.session.passport.nick,
				});
			}
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