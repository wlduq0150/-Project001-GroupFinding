const express = require("express");
const redisClient = require("../src/redis");
const fs = require("fs");
const path = require("path");
const { isLoggedIn, isNotLoggedIn, isGroupIn } = require("./middlewares");
const { getGroup, getAllGroups, saveGroup, deleteGroup, updateGroup, randomGroupId} = require("../src/groupFunction");

function getNumGroup(groupId, req) {
	const chatSocket = req.app.get("io").of("chat");
	const rooms = chatSocket.adapter.rooms[`${groupId}`];
	let num = 0;
	if (!rooms) return num;
	for (let socket in rooms.sockets) {
		num += 1;
	}
	return num;
}

function userInGroup(socket, groupId, userId) {
	const socketRooms = socket.adapter.rooms[`${groupId}`];
	if (socketRooms.sockets[userId]) {
		return true;
	} else {
		return false;
	}
}

async function isSelectPos(groupId, nick) {
	const groupData = await getGroup(groupId);
	const position_user = groupData.position_user;
	for (var i=0; i<position_user.length; i++) {
		if (position_user[i] === nick) return [true, i];
	}
	return [false, null];
}


const router = express.Router();

router.get("/", isLoggedIn, (req, res, next) => {
	if (req.session.groupId !== null && req.session.groupId !== undefined) {
		return res.status(200).send("fail");
	}
	res.render("create");
});

router.get("/isJoin", isLoggedIn, (req, res, next) => {
	if (req.session.groupId !== null && req.session.groupId !== undefined) {
		return res.json(req.session.groupId);
	}
	return res.status(200).json(null);
});

router.get("/groups", async (req, res, next) => {
	const groups = await getAllGroups();
	return res.json(groups);
});

router.get("/:groupId", isLoggedIn, async (req, res, next) => {
	const group = await getGroup(parseInt(req.params.groupId));
	return res.json(group);
});

router.post("/create", isLoggedIn, async (req, res, next) => {
	try {
		const groupId = await randomGroupId();
		let max = 5;
		const current = 0;
		const position = [];
		const position_user = ["none", "none", "none", "none", "none"];
		for (var i=0; i<5; i++) {
			const pos = req.body[`pos${i+1}`];
			if (pos == "non") max -= 1;
			position.push(pos);
		}
		const newGroup = {
			groupId,
			max,
			current,
			name: req.body.name,
			owner: req.body.owner,
			type: req.body.type,
			position,
			position_user,
		};
		console.log(newGroup);
		await saveGroup(groupId, newGroup);
		return res.redirect(`/?create=${groupId}`);
	} catch (err) {
		console.log(err);
		next(err);
	}
});

router.post("/join", isLoggedIn, async (req, res, next) => {
	try {
		const { groupId, chatId, posId, create } = req.body;
		const chatSocket = req.app.get("io").of("chat");
		const clientChatSocket = chatSocket.sockets[chatId];
		const clientPosSocket = req.app.get("io").of("position").sockets[posId];
		const group = await getGroup(groupId);
		const joinNum = getNumGroup(groupId, req);
		if (!group) {
			return res.status(400).send("fail");
		}
		//그룹을 만든 후 최초입장인지 확인
		if (create) {
			if (group.owner !== req.user.nick || joinNum !== 0) {
				return res.status(400).send("fail");
			}
		}
		//이미 그룹에 소속되어 있는지 확인
		if (req.session.groupId) {
			if (req.session.groupId !== groupId) {
				return res.status(401).send("fail");
			}
			clientPosSocket.emit("selectPosition", { groupId });
			return res.status(201).send("success");
		}
		//그룹인원수 확인
		if (joinNum < group.max) {
			clientChatSocket.join(groupId);
			clientPosSocket.join(groupId);
			req.session.groupId = groupId;
			req.session.passport.groupId = groupId;
			req.session.chatId = chatId;
			req.session.posId = posId;
			console.log(req.session);
			const msg = {
				userName: 'system',
				message: `${req.user.nick}님이 그룹에 입장하셨습니다.`,
			};
			chatSocket.to(groupId).emit("message", msg);
			clientPosSocket.emit("selectPosition", { groupId });
			return res.status(200).send("success");
		} else {
			return res.status(402).send("fail");
		}
	} catch (err) {
		console.error(err);
		next(err);
	}
});

router.post("/leave/:groupId", isLoggedIn, async (req, res, next) => {
	try {
		const groupId = parseInt(req.params.groupId);
		const group = await getGroup(groupId);
		const position = group.position;
		const position_user = group.position_user;
		const chatSocket = req.app.get("io").of("chat");
		const posSocket = req.app.get("io").of("position");
		const clientChatSocket = chatSocket.sockets[req.session.chatId];
		const clientPosSocket = posSocket.sockets[req.session.posId];
		if (groupId === req.session.groupId && userInGroup(posSocket, groupId, req.session.posId) && userInGroup(chatSocket, groupId, req.session.chatId)) {
			req.session.groupId = null;
			const msg = {
				userName: 'system',
				message: `${req.user.nick}님이 그룹에서 퇴장하셨습니다.`,
			};
			chatSocket.to(groupId).emit("message", msg);
			clientChatSocket.leave(groupId);
			const isPos = await isSelectPos(groupId, req.user.nick);
			if (isPos[0]) {
				position_user[isPos[1]] = "none";
				await updateGroup(groupId, "position_user", position_user);
				posSocket.to(groupId).emit("dp", { 
					change: true,
					pos: isPos[1],
					position,
					nick: req.user.nick,
				});
			}
			clientPosSocket.emit("leave");
			clientPosSocket.leave(groupId);
			if (getNumGroup(groupId, req) === 0) {
				await deleteGroup(groupId);
			}
			return res.send("ok");
		} else {
			return res.status(304).send("해당 유저가 해당 방에 접속되어 있지 않음.");
		}
	} catch (err) {
		console.error(err);
		next(err);
	}
});

router.post("/suddenLeave", async (req, res, next) => {
	const { nick } = req.body;
	const groups = await getAllGroups();
	for (let i=0; i<groups.length; i++) {
		const group = groups[i];
		if (group.position_user.includes(nick)) {
			const groupId = group.groupId;
			const index = group.position_user.indexOf(nick);
			if (index > 0 && index <= 5) {
				group.position_user[index] = "none";
			}
			
			await updateGroup(groupId, "position_user", group.position_user);
			if (getNumGroup(groupId, req) === 0) {
				await deleteGroup(groupId);
			}
			
			return res.status(200).send(true);
		}
	}	
	return res.status(200).send(false);
});

router.post("/:groupId/sp/:pos", isLoggedIn, async (req, res, next) => {
	try {
		const groupId = parseInt(req.params.groupId);
		const pos = parseInt(req.params.pos) - 1;
		const group = await getGroup(groupId);
		const position = group.position;
		const position_user = group.position_user;
		const posSocket = req.app.get("io").of("position");
		const clientPosSocket = posSocket.sockets[req.session.posId];
		if (position_user[pos] === "none" && position[pos] !== "non" && !(await isSelectPos(groupId, req.user.nick))[0] && userInGroup(posSocket, groupId, req.session.posId)) {
			position_user[pos] = req.user.nick;
			await updateGroup(groupId, "position_user", position_user);
			posSocket.to(groupId).emit("sp", { 
				change: true,
				pos,
				position,
				nick: req.user.nick,
			});
			return res.status(200).send("success");
		} else {
			return res.status(200).send("fail");
		}
	} catch (err) {
		console.error(err);
		next(err);
	}
});

router.post("/:groupId/dp/:pos", isLoggedIn, async (req, res, next) => {
	try {
		const groupId = parseInt(req.params.groupId);
		const pos = parseInt(req.params.pos) - 1;
		const group = await getGroup(groupId);
		const position = group.position;
		const position_user = group.position_user;
		const posSocket = req.app.get("io").of("position");
		const clientPosSocket = posSocket.sockets[req.session.posId];
		if (position_user[pos] === req.user.nick && userInGroup(posSocket, groupId, req.session.posId)) {
			position_user[pos] = "none";
			await updateGroup(groupId, "position_user", position_user);
			posSocket.to(groupId).emit("dp", { 
				change: true,
				pos,
				position,
				nick: req.user.nick,
			});
			return res.status(200).send("success");
		} else {
			return res.status(403).send("fail");
		}
	} catch (err) {
		console.error(err);
		next(err);
	}
});

router.post("/chat", isLoggedIn, isGroupIn, (req, res, next) => {
	try {
		const { groupId } = req.session;
		const { message } = req.body;
		req.app.get("io").of("chat").to(groupId).emit("message", {
			userName: req.user.nick,
			message,
		});
		return res.send("success");
	} catch (err) {
		console.error(err);
		next(err);
	}
});

module.exports = router;