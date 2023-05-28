const { getUserInfo } = require("../src/userFunction");

exports.isLoggedIn = (req, res, next) => {
	if (req.isAuthenticated()) {
		next();
	} else {
		return res.redirect("/loginPage");
	}
}

exports.isNotLoggedIn = (req, res, next) => {
	if (!req.isAuthenticated()) {
		next();
	} else {
		res.redirect("/");
	}
}

exports.isGroupIn = async (req, res, next) => {
	const info = await getUserInfo(req.session.passport.nick);
	if (info.groupId) {
		next();
	} else {
		res.redirect("/");
	}
}