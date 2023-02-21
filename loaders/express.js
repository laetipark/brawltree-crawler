import express from 'express';

import path from 'path';
import morgan from 'morgan';
import cors from 'cors';

import blossomRouter from '../routes/index.js';

export default async (app) => {
    const __dirname = path.dirname(path.resolve());
    console.log(__dirname);

    app.use(cors({
        origin: "*",                // 출처 허용 옵션
        credentials: true,          // 응답 헤더에 Access-Control-Allow-Credentials 추가
        optionsSuccessStatus: 200,  // 응답 상태 200으로 설정
    }));
    app.use(morgan('dev'));
    app.use('/', express.static(path.join(__dirname, '/blossom-web-frontend/build')));
    app.use(express.json());
    app.use(express.urlencoded({
        extended: false
    }));

    // routes

    app.use('/', blossomRouter);
    app.use((req, res, next) => {
        res.status(404).send('Not Found');
    });

    app.use((err, req, res, next) => {
        console.error(err);
        res.status(500).send(err.message);
    });

}