const dotenv = require("dotenv");
dotenv.config();

const path = require("path");
const fs = require("fs");
const express = require("express");
const nunjucks = require("nunjucks");
const morgan = require("morgan");
const { sequelize } = require("./models");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const passport = require("passport");
const passportConfig = require("./passport");
const webSocket = require("./src/socket");
const redisClient = require("./src/redis");
const dataConfig = require("./src/dataConfig");

const indexRouter = require("./routes");
const groupRouter = require("./routes/group");
const userRouter = require("./routes/user");


const app = express();
passportConfig();
app.set("port", process.env.PORT || 8001);
app.set("view engine", "html");
nunjucks.configure("views", {
	express: app,
	watch: true,
});

app.use(express.static(path.join(__dirname, "public")));
sequelize.sync({ force: false })
.then(() => {
	console.log("데이터베이스 연결 성공");
})
.catch(() => {
	console.log("데이터베이스 연결 실패");
});

redisClient.connect()
.then(() => {
	console.log("redis 연결 성공");
	dataConfig();
})
.catch(() => {
	console.log("redis 연결 실패");
});

const sessionMiddleware = session({
	resave: false,
	saveUninitialized: false,
	secret: process.env.COOKIE_SECRET,
	cookie: {
		httpOnly: true,
		secure: false,
	}
});
app.use(morgan("dev"));
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());
//app.use(cors());

app.use("/", indexRouter);
app.use("/group", groupRouter);
app.use("/user", userRouter);

///오류처리
app.use((req, res, next) => {
	const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
	error.status = 404;
	next(error);
});

app.use((err, req, res, next) => {
	res.locals.message = err.message;
	res.locals.error = process.env.NODE_ENV !== "production" ? err : {};
	res.status(err.status || 500);
	res.render("error");
});
///

const server = app.listen(app.get("port"), () => {
	console.log(app.get("port") + "번 포트에서 대기 중");
});

webSocket(server, app, sessionMiddleware);