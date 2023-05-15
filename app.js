import express from "express";
import loaders from "./loaders/index.js";
import config from "./config/config.js";
import cookieParser from "cookie-parser";
import session from "express-session";

import scheduler from "./scheduler/index.js";

const main = async () => {
    const app = express();
    await loaders(app);

    app.use(cookieParser(process.env.COOKIE_SECRET));
    app.use(session({
        resave: false,
        saveUninitialized: false,
        secret: process.env.COOKIE_SECRET,
        cookie: {
            httpOnly: true,
            secure: false,
        },
        name: 'session-cookie',
    }));

    app.listen(config.port, () => {
        console.log('🌸 PORT NUM', config.port, '🌸');
    });
}

main().then(() => {
    console.log('🌸 HELLO BLOSSOM 🌸');
    scheduler();
});