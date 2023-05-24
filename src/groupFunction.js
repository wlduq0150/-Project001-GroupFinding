const redisClient = require("./redis");

async function getGroup(groupId) {
	groupId = groupId.toString();
	const groupData = await redisClient.json.get(groupId);
	return groupData;
}

async function getAllGroups() {
	const groupIdList = await redisClient.lRange("groupIdList", 0, -1);
	const groupList = [];
	for (const index in groupIdList) { 
		const groupId = groupIdList[index]
		const group = await getGroup(groupId);
		if (group) { groupList.push(group); }
	}
	return groupList;
}

async function saveGroup(groupId, groupData) {
	groupId = groupId.toString();
	await redisClient.json.set(groupId, ".", groupData);
	const groupIdList = await redisClient.lRange("groupIdList", 0, -1);
	if (!groupIdList.includes(groupId)) {
		await redisClient.rPush("groupIdList", groupId);
	}
	return true;
}

async function deleteGroup(groupId) {
	groupId = groupId.toString();
	const groupData = await getGroup(groupId);
	if (groupData) {
		await redisClient.del(groupId);
		await redisClient.lRem("groupIdList", 1, groupId);
		await redisClient.sAdd("IdNumbers", groupId);
		return true;
	}
	return false;
}

async function updateGroup(groupId, key, value) {
	groupId = groupId.toString();
	let groupData = await getGroup(groupId);
	if (groupData && key in groupData) {
		groupData[key] = value;
		await saveGroup(groupId, groupData);
		return true;
	}
	return false;
}

async function randomGroupId() {
	const IdNumbers = await redisClient.sMembers("IdNumbers");
	const num = IdNumbers.length;
	const randomIndex = Math.floor(Math.random() * num);
	const randomId = IdNumbers[randomIndex];
	const result = await redisClient.sRem("IdNumbers", randomId);
	if (result) {
		return randomId;
	}
	return -1;
}

exports.getGroup = getGroup;
exports.getAllGroups = getAllGroups;
exports.saveGroup = saveGroup;
exports.deleteGroup = deleteGroup;
exports.updateGroup = updateGroup;
exports.randomGroupId = randomGroupId;