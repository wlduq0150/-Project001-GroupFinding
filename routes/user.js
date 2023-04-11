const express = require("express");
const passport = require("passport");
const bcrypt = require("bcrypt");
const { isLoggedIn, isNotLoggedIn } = require("./middlewares");
const User = require("../models/user");

const router = express.Router();

router.post("/join", isNotLoggedIn, async (req, res, next) => {
	try {
		const { email, password, nick } = req.body;
		const exUser = await User.findOne({ where: { email }});
		if (exUser) {
			return res.redirect("/");
		}
		const hash = await bcrypt.hash(password, 12);
		await User.create({
			nick,
			email,
			password: hash,
		});
		return res.redirect("/");
	} catch (err) { 
		console.error(err);
		next(err);
	}
});

router.post("/login", isNotLoggedIn, (req, res, next) => {
	passport.authenticate("local", (authError, user, info) => {
		if (authError) {
			console.error(authError);
			return next(authError);
		}
		if (!user) {
			console.log(info.message);
			return res.redirect("/");
		}
		req.session.groupId = null;
		req.session.posId = null;
		req.session.chatId = null;
		return req.login(user, (err) => {
			if (err) {
				console.error(err);
				return next(err);
			}
			return res.redirect("/");
		});
	})(req, res, next);
});

router.get("/groupId", isLoggedIn, (req, res, next) => {
	if (req.session.groupId) {
		return res.status(200).send(req.session.groupId);
	}
	return res.status(200).send(null);
});

router.get("/logout", (req, res, next) => {
	req.session.destroy();
	req.logout((err) => {
		res.redirect("/");
	});
});

module.exports = router;