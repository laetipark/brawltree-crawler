import express from "express";

import path from "path";
import morgan from "morgan";
import cors from "cors";

import index from "../routes/index.js";
import member from "../routes/member.js";
import battle from "../routes/battle.js";
import brawler from "../routes/brawler.js";
import season from "../routes/season.js";
import config from "../config/config.js";

export default async (app) => {
    const __dirname = path.dirname(path.resolve());
    console.log(__dirname);

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

    app.use('/', express.static(path.join(__dirname, '/blossom-web-frontend/build')));
    app.use(express.json({limit: '50mb'}));
    app.use(express.urlencoded({
        limit: '50mb',
        extended: false
    }));

    // routes

    app.use('/', index);
    app.use('/member', member);
    app.use('/brawler', brawler);
    app.use('/battle', battle);
    app.use('/season', season);
    app.use((req, res, next) => {
        res.status(404).send('Not Found');
    });

    app.use((err, req, res, next) => {
        console.error(err);
        res.status(500).send(err.message);
    });


}