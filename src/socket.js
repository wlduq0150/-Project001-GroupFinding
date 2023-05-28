const SocketIO =  require("socket.io");
const axios = require('axios');
const path = require("path");
const { initUserSession, getUserInfo, setUserInfo, destroyUserSession } = require("../src/userFunction");
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
	
	chat.on("connection", async (socket) => {
		const req = socket.request;
		if (req.session.passport && req.session.passport.nick) {
			const info = await getUserInfo(req.session.passport.nick);
			if (info) {
				await setUserInfo(req.session.passport.nick, "chatId", socket.id);
			}
		}
		console.log("chat네임스페이스 접속.");
		
		socket.on("disconnect", async () => {
			console.log("chat네임스페이스 접속해제.");
			const req = socket.request;
			if (req.session.passport && req.session.passport.nick) {
				let { headers: { referer }} = req;
				referer = referer.replace(/(?<=\?).*/, "").replace("?", "");
				const url = referer + "group/suddenLeave";
				await axios.post(url, {
					nick: req.session.passport.nick,
				});
			}
		});
	});
	
	position.on("connection", async (socket) => {
		const req = socket.request;
		if (req.session.passport && req.session.passport.nick) {
			const info = await getUserInfo(req.session.passport.nick);
			if (info) {
				await setUserInfo(req.session.passport.nick, "chatId", socket.id);
			}
		}
		console.log("position네임스페이스 접속.");
		socket.emit("newCreate");
		
		socket.on("disconnect", () => {
			console.log("position네임스페이스 접속해제.");
			
		});
	})
}