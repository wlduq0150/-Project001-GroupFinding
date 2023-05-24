const redis = require("redis");
const util = require("util");
const redisSecret = process.env.REDIS_SECRET;

const redisClient = redis.createClient({
	password: redisSecret,
	socket: {
		port: 17923,
        host: 'redis-17923.c299.asia-northeast1-1.gce.cloud.redislabs.com'
    },
});

module.exports = redisClient;