const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

router.use((req, res, next) => {
	res.locals.user = req.user;
	next();
});

router.get("/", (req, res, next) => {
	try {
		const filePath = path.join(__dirname, "..", "data", "groupList.json");
		const groups_json = fs.readFileSync(filePath);
		const groups = JSON.parse(groups_json);
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