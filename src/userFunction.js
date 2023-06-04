const redisClient = require("./redis");

async function initUserSession(sessionId) {
	const info = {
		groupId: null,
		audioId: null,
		chatId: null,
		posId: null,
	}
	await redisClient.json.set(sessionId, ".", info);
}

async function destroyUserSession(sessionId) {
	const info = await getUserInfo(sessionId);
	if (info) {
		await redisClient.del(sessionId);
		return true;
	}
	return false;
}

async function getUserInfo(sessionId) {
	const info = await redisClient.json.get(sessionId);
	return info;
}

async function setUserInfo(sessionId, key, value) {
	const info = await getUserInfo(sessionId);
	if (info && (key in info)) {
		info[key] = value;
		await redisClient.json.set(sessionId, ".", info);
		return true;
	}
	return false;
}

exports.initUserSession = initUserSession;
exports.destroyUserSession = destroyUserSession;
exports.setUserInfo = setUserInfo;
exports.getUserInfo = getUserInfo;