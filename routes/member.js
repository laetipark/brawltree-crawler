import express from "express";
import {col, fn, literal, Op} from "sequelize";

import Member from "../models/member.js";
import MemberBrawler from "../models/member_brawler.js";
import Battle from "../models/battle.js";
import Brawler from "../models/brawler.js";
import Record from "../models/record.js";
import Friend from "../models/friend.js";
import Season from "../models/season.js";
import Rotation from "../models/rotation.js";

import config from "../config/config.js";

const router = express.Router();

router.get('/', async (req, res) => {
    const members = await Member.findAll({
        order: [["trophy_current", "DESC"]],
        raw: true
    }).then((result) => {
        return result;
    });

    res.send(members);
});

router.get('/:id', async (req, res) => {
    const {today} = req.query;
    const {tomorrow} = req.query;

    const member = await Member.findOne({
        where: {
            id: `#${req.params.id}`
        },
        raw: true
    }).then((result) => {
        return result;
    });

    const battles = await Battle.findAll({
        include: [
            {
                model: Rotation,
                required: true,
                attributes: []
            },
        ],
        attributes: ['match_date', 'brawler_id', 'match_type',
            'match_rank', 'match_result', 'Rotation.mode'],
        where: {
            member_id: `#${req.params.id}`,
            player_id: `#${req.params.id}`,
            match_date: {
                [Op.between]: [today, tomorrow]
            },
        },
        order: [['match_date', 'DESC']],
        raw: true
    }).then((result) => {
        return result.reduce((acc, current) => {
            if (acc.findIndex(({match_date}) =>
                JSON.stringify(match_date) === JSON.stringify(current.match_date)) === -1) {
                acc.push(current);
            }
            return acc;
        }, []);
    });

    const records = await Record.findAll({
        where: {
            member_id: `#${req.params.id}`
        },
        order: [['match_count', 'DESC']],
        raw: true
    }).then((result) => {
        const records = {
            mapMode: {
                gemGrab: {},
                brawlBall: {},
                bounty: {},
                heist: {},
                hotZone: {},
                knockout: {},
                duels: {},
                soloShowdown: {},
                duoShowdown: {}
            },
            trophyLeague: [],
            soloPowerLeague: [],
            teamPowerLeague: []
        };
        for (const mode of config.modeList) {
            const mapMode = result.filter(item => item.map_mode === mode);

            if (mapMode.length !== 0 && records.mapMode[`${mode}`] !== undefined) {
                records.mapMode[`${mode}`].match_count =
                    mapMode.map(item => item.match_count)
                        .reduce((count, total) => count + total);
                records.mapMode[`${mode}`].victory_count =
                    mapMode.map(item => item.victory_count)
                        .reduce((count, total) => count + total);
                records.mapMode[`${mode}`].defeat_count =
                    mapMode.map(item => item.defeat_count)
                        .reduce((count, total) => count + total);
            }
        }

        records.matchChange = result.filter(item => item.match_type === '0').length > 0 ?
            result.filter(item => item.match_type === '0').map(item => item.match_change)
                .reduce((trophy, total) => trophy + total) : 0;

        records.trophyLeague = result.filter(item => item.match_type === '0');
        records.soloPowerLeague = result.filter(item => item.match_type === '2');
        records.teamPowerLeague = result.filter(item => item.match_type === '3');
        return records;
    });

    const season = await Season.findOne({
        order: [['start_date', 'DESC']],
        raw: true,
    }).then((result) => {
        return result;
    });

    const dailyCount = await Battle.findOne({
        attributes: [[literal('count(case when match_result = -1 then 1 end)'), 'victory_count'],
            [literal('count(case when match_result = 0 then 1 end)'), 'draw_count'],
            [literal('count(case when match_result = 1 then 1 end)'), 'defeat_count']],
        where: {
            member_id: `#${req.params.id}`,
            player_id: `#${req.params.id}`,
            match_date: {
                [Op.between]: [today, tomorrow]
            },
        },
        order: [['match_date', 'DESC']],
        raw: true
    }).then((result) => {
        return result;
    });

    const seasonCount = await Record.findOne({
        attributes: [
            [literal('sum(match_count)'), 'match_count'],
            [literal('sum(victory_count)'), 'victory_count'],
            [literal('sum(defeat_count)'), 'defeat_count']],
        where: {
            member_id: `#${req.params.id}`
        },
        raw: true
    }).then((result) => {
        return result;
    });

    const friendsPoint = await Friend.findOne({
        attributes: [
            'member_id',
            [fn('sum', col('point')), 'total_point']
        ],
        where: {
            member_id: `#${req.params.id}`,
        },
        group: ['member_id'],
        raw: true
    }).then(result => {
        return result
    });

    const friendsGroup = await Friend.findAll({
        attributes: [
            'member_id',
            'friend_id',
            'friend_name',
            [fn('sum', col('point')), 'friend_point'],
            [fn('sum', col('match_count')), 'match_count'],
            [fn('sum', col('victory_count')), 'victory_count'],
            [fn('sum', col('defeat_count')), 'defeat_count'],
        ],
        where: {
            member_id: `#${req.params.id}`,
        },
        group: ['friend_id', 'friend_name'],
        order: [['friend_point', 'DESC']],
        raw: true
    }).then(result => {
        return result
    });

    const friends = await Friend.findAll({
        where: {
            member_id: `#${req.params.id}`,
        },
        order: [['point', 'DESC']],
        raw: true
    }).then(result => {
        return result;
    });

    const brawlers = await MemberBrawler.findAll({
        include: [
            {
                model: Brawler,
                required: true,
                attributes: ['name']
            },
        ],
        where: {
            member_id: `#${req.params.id}`,
        },
        order: [['trophy_current', 'DESC']],
        raw: true
    }).then((result) => {
        return result;
    });

    res.send({
        member: member,
        battles: battles,
        records: records,
        season: season,
        dailyCount: dailyCount,
        seasonCount: seasonCount,
        friendsGroup: friendsGroup,
        friendsPoint: friendsPoint,
        friends: friends,
        brawlers: brawlers
    });
});

export default router;