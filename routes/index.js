const express = require("express");
const fs = require("fs");
const path = require("path");
const { getAllGroups } = require("../src/groupFunction");
const redisClient = require("../src/redis");

const router = express.Router();

router.use((req, res, next) => {
	res.locals.user = req.user;
	next();
});

router.get("/", async (req, res, next) => {
	try {
		const groups = await getAllGroups();
		res.render("main", {
			title: "그룹 찾기",
			groups,
		});
	} catch (err) {
		console.error(err);
	}
});

router.get("/joinPage", (req, res, next) => {
	res.render("join");
});

router.get("/loginPage", (req, res, next) => {
	res.render("login");
});

module.exports = router;