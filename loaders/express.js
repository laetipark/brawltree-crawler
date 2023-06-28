import express from "express";

import path from "path";
import morgan from "morgan";
import cors from "cors";

import index from "../routes/index.js";
import member from "../routes/member.js";
import brawler from "../routes/brawler.js";
import battle from "../routes/battle.js";
import map from "../routes/map.js";
import rotation from "../routes/rotation.js";
import season from "../routes/season.js";
import config from "../config/config.js";
import cookieParser from "cookie-parser";
import session from "express-session";

export default async () => {
    const app = express();
    path.dirname(path.resolve());

    app.use(cors({
        origin: "*",                // 출처 허용 옵션
        credentials: true,          // 응답 헤더에 Access-Control-Allow-Credentials 추가
        optionsSuccessStatus: 200,  // 응답 상태 200으로 설정
    }))

    if (config.project === "pro") {
        app.use(morgan('combined'));
    } else {
        app.use(morgan('dev'));
    }

    app.use(express.json({limit: '50mb'}));
    app.use(express.urlencoded({
        limit: '50mb',
        extended: false
    }));

    // routes
    app.use('/', index);
    app.use('/battle', battle);
    app.use('/brawler', brawler);
    app.use('/map', map);
    app.use('/member', member);
    app.use('/rotation', rotation);
    app.use('/season', season);
    app.use((req, res) => {
        res.status(404).send('Not Found');
    });

    app.use((err, req, res) => {
        console.error(err);
        res.status(500).send(err.message);
    });

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