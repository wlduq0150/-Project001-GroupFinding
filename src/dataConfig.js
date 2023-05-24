const fs = require("fs");
const path = require("path");
const redisClient = require("./redis");
const max_group = process.env.MAX_GROUP;

module.exports = async () => {
	redisClient.flushAll()
	.then(() => {
		for (let id=0; id<process.env.MAX_GROUP; id++) {
			redisClient.sAdd("IdNumbers", id.toString());
		};
		console.log("redis 초기화 성공");
	})
	.catch(() => {
		console.log("redis 초기화 실패");
	});
}