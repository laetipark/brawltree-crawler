import express from 'express';
import sequelize, {col, fn, literal, Op} from "sequelize";

import Member from "../models/member.js";
import Battle from "../models/battle.js";
import Rotation from "../models/rotation.js";
import Season from "../models/season.js";

import config from "../config/config.js";

const router = express.Router();

router.get('/', async (req, res) => {
    const {today} = req.query;
    const {tomorrow} = req.query;
    const {type} = req.query;
    const {mode} = req.query;
    const matchType = config.typeList.filter.includes(type) ? config.typeList[`${type}`] : config.typeList.all;
    const matchMode = config.modeList.includes(mode) ? Array(mode) : config.modeList;

    // TODO: Duels 모드 횟수 중복
    const battles = await Battle.findAll({
        include: [
            {
                model: Member,
                required: true,
                attributes: ['name']
            },
            {
                model: Rotation,
                required: true,
                attributes: [],
                where: {
                    mode: {
                        [Op.in]: matchMode
                    }
                }
            },
        ],
        attributes: [
            "member_id",
            [fn("count", col("member_id")), "match_count"],
            [fn("sum", col('match_change')), "match_change"]
        ],
        group: ["member_id"],
        where: {
            member_id: [sequelize.col('Battle.player_id')],
            match_date: {
                [Op.between]: [today, tomorrow]
            },
            match_type: {
                [Op.in]: matchType
            },
        },
        order: [['match_count', 'DESC']],
        raw: true,
    }).then((result) => {
        return result;
    });

    const season = await Season.findOne({
        order: [['start_date', 'DESC']],
        raw: true,
    }).then((result) => {
        return result;
    });

    res.send({
        battles: battles,
        season: season
    });
});

router.get('/:id', async (req, res) => {
    const {today} = req.query;
    const {tomorrow} = req.query;

    const member = await Member.findOne({
        attributes: ['id', 'name', 'trophy_current', 'league_solo_current', 'league_team_current', 'profile_picture'],
        where: {
            id: `#${req.params.id}`,
        },
        raw: true
    }).then((result) => {
        return result;
    });

    const battles = await Battle.findAll({
        attributes:
            ["member_id", [fn('JSON_OBJECT', "id", col('match_date'),
                "match_duration", col('match_duration'), "map_id", col('map_id'),
                "raw_type", col('raw_type'), "match_type", col('match_type'), "match_mode", col('match_mode'),
                "match_grade", col('match_grade'), "match_change", col('match_change')), 'info'],
                [fn('JSON_ARRAYAGG', fn('JSON_OBJECT',
                    "player_id", col('player_id'), "player_name", col('player_name'),
                    "player_team", col('player_team'), "brawler_id", col('brawler_id'),
                    "brawler_power", col("brawler_power"), "brawler_trophy", col('brawler_trophy'),
                    "match_rank", col('match_rank'), "match_result", col('match_result'), "raw_change", col('raw_change'))), 'players']],
        group: ['member_id', 'match_date',
            'match_duration', 'map_id', 'match_type',
            'match_mode', 'match_grade', 'match_change', 'raw_type'],
        where: {
            match_date: {
                [Op.between]: [today, tomorrow]
            },
            member_id: `#${req.params.id}`
        },
        raw: true,
        logging: true
    }).then((result) => {
        return result;
    });

    const season = await Season.findOne({
        order: [['start_date', 'DESC']],
        raw: true,
    }).then((result) => {
        return result;
    });

    res.send({
        member: member,
        battles: battles,
        season: season
    });
});

export default router;