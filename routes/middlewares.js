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

exports.isGroupIn = (req, res, next) => {
	if (req.session.groupId) {
		next();
	} else {
		console.log("시발 안된다고 했잖아");
		res.redirec("/");
	}
}