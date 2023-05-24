const express = require("express");
const cors = require("cors");
const passport = require("passport");
const bcrypt = require("bcrypt");
const { isLoggedIn, isNotLoggedIn } = require("./middlewares");
const User = require("../models/user");

const router = express.Router();

router.post("/join", isNotLoggedIn, async (req, res, next) => {
	try {
		const { email, password, nick, tag } = req.body;
		console.log(tag);
		const exUser = await User.findOne({ where: { email }});
		if (exUser) {
			return res.redirect("/");
		}
		
		if (req.session.check) {
			if (req.session.check.tag && tag !== req.session.check.tag) {
				return res.redirect("/joinPage?error=배틀태그가 일치하지 않습니다.");
			}
			if (req.session.check.email && email !== req.session.check.email) {
				return res.redirect("/joinPage?error=이메일이 일치하지 않습니다.");
			}
			if (req.session.check.nick && nick !== req.session.check.nick) {
				return res.redirect("/joinPage?error=닉네임이 일치하지 않습니다.");
			}
		}
		
 		const hash = await bcrypt.hash(password, 12);
		await User.create({
			nick,
			email,
			password: hash,
			tag,
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
			req.session.passport.nick = user.nick;
			return res.redirect("/");
		});
	})(req, res, next);
});

router.get("/logout", (req, res, next) => {
	req.session.destroy();
	req.logout((err) => {
		res.redirect("/");
	});
});

router.get("/groupId", isLoggedIn, (req, res, next) => {
	if (req.session.groupId) {
		return res.status(200).send(req.session.groupId);
	}
	return res.status(200).send(null);
});

router.get("/tag/:nick", isLoggedIn, async (req, res, next) => {
	const nick = req.params.nick;
	const exUser = await User.findOne({ where: { nick }});
	if (exUser) {
		return res.status(200).send(exUser.tag);
	} 
	return res.status(200).send(null);
});

router.get("/verifyBNET", passport.authenticate("bnet"));

router.get("/verifyBNET/callback", passport.authenticate("bnet", {
	failureRedirect: "/",
}), async (req, res) => {
	let tag = req.user.battletag;
	tag = tag.split("#")[0] + "-" + tag.split("#")[1];
	
	const exUser = await User.findOne({ where: { tag }});
	if (exUser) {
		return res.redirect("/joinPage?tag=" + "tag already joined");
	}
	
	if (!req.session.check) {
		req.session.check = { tag };
	} else {
		req.session.check.tag = tag;
	}
	console.log(req.session);
	return res.redirect("/joinPage?tag=" + tag);
});

router.post("/isExistEmail", async (req, res, next) => {
	const { email } = req.body;
	
	const exUser = await User.findOne({ where: { email }});
	if (exUser) {
		if (req.session.check && req.session.check.email) {
			req.session.check.email = null;
		}
		return res.status(200).send(true);
	}
	
	if (!req.session.check) {
		req.session.check = { email };
	} else {
		req.session.check.email = email;
	}
	console.log(req.session);
	return res.status(200).send(false);
});

router.post("/isExistNick", async (req, res, next) => {
	const { nick } = req.body;
	
	const exUser = await User.findOne({ where: { nick }});
	if (exUser) {
		if (req.session.check && req.session.check.nick) {
			req.session.check.nick = null;
		}
		return res.status(200).send(true);
	}
	
	if (!req.session.check) {
		req.session.check = { nick };
	} else {
		req.session.check.nick = nick;
	}
	console.log(req.session);
	return res.status(200).send(false);
});

module.exports = router;