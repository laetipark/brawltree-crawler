import express from 'express';
import {fn, col, Op} from 'sequelize';
import Member from '../models/member.js';
import Brawler from '../models/brawler.js';
import MemberBrawler from '../models/member_brawler.js';
import Pick from '../models/pick.js';
import BattleLog from '../models/battle_log.js';
import Rotation from '../models/rotation.js';
import Season from '../models/season.js';

const router = express.Router();

router.get('/member', async (req, res) => {
    const members = await Member.findAll({raw: true}).then((result) => {
        return result
    });

    res.send(members);
});

router.get('/brawler', async (req, res) => {
    const brawlers = await Brawler.findAll({
        raw: true
    }).then((result) => {
        return result
    });

    const memberBrawlers = await MemberBrawler.findAll({
        raw: true
    }).then((result) => {
        return result
    });

    const pick = await Pick.findAll({
        raw: true
    }).then((result) => {
        return result
    });

    res.send({brawlers: brawlers, memberBrawlers: memberBrawlers, pick: pick});
});

router.get('/rotation', async (req, res) => {

});

const typeFilter = {
    filter: ['all', 'trophyLeague', 'powerLeague', 'clubLeague', 'challenge'],
    all: [0, 2, 3, 4, 5, 6],
    trophyLeague: [0],
    powerLeague: [2, 3],
    clubLeague: [6],
    challenge: [4, 5]
};
const modeFilter = ['gemGrab', 'brawlBall', 'bounty', 'heist', 'hotZone', 'knockout', 'duel', 'soloShowdown', 'duoShowdown'];

router.get('/record', async (req, res) => {


    const members = await Member.findAll({
        raw: true
    }).then((result) => {
        return result
    });

    const {today} = req.query;
    const {tomorrow} = req.query;
    const {type} = req.query;
    const {mode} = req.query;
    const gameType = typeFilter.filter.includes(type) ? typeFilter[`${type}`] : typeFilter.all;
    const gameMode = modeFilter.includes(mode) ? Array(mode) : modeFilter;

    const filterGameMode = await Rotation.findAll({
        attributes: ['id'],
        where: {
            mode: {
                [Op.in]: gameMode
            }
        },
        raw: true
    }).then((result) => {
        return result
    });

    const battleLog = await BattleLog.findAll({
        include: [
            {
                model: Member,
                required: true,
                attributes: ['id']
            },
        ],
        attributes: ['member_id', [fn('concat',
            fn('concat', `{"id":"`, col("date"), `",`),
            fn('concat', `"member_id":"`, col('member_id'), `",`),
            fn('concat', `"duration":"`, col('duration'), `",`),
            fn('concat', `"map_id":"`, col('map_id'), `",`),
            fn('concat', `"type":"`, col('game_type'), `",`),
            fn('concat', `"trophy_grade":"`, col('trophy_grade'), `",`),
            fn('concat', `"trophy_change":"`, col('trophy_change'), `",`),
            fn('concat', `"battle":[`),
            fn('group_concat',
                fn('concat', `{"tag":"`, col('player_tag'), `",`),
                fn('concat', `"name":"`, fn('replace', fn('replace', col('player_name'), '\\', '\\\\'), '\"', '\\\"'), `",`),
                fn('concat', `"brawler":"`, col('player_brawler_id'), `",`),
                fn('concat', `"power":"`, col('player_brawler_power'), `",`),
                fn('concat', `"trophy":"`, col('player_brawler_trophy'), `",`),
                fn('concat', `"rank":"`, col('rank'), `",`),
                fn('concat', `"result":"`, col('game_result'), `",`),
                fn('concat', `"team":"`, col('player_team'), `",`),
                fn('concat', `"star_player":"`, col('is_star_player'), `"}`),
            ), "]}"), 'json']],
        where: {
            map_id: {
                [Op.in]: filterGameMode.map(item => item.id)
            },
            game_type: {
                [Op.in]: gameType
            },
            member_id: {
                [Op.in]: members.map(item => item.id)
            },
            date: {
                [Op.gte]: today,
                [Op.lt]: tomorrow
            }
        },
        group: ['member_id', 'date', 'duration', 'map_id', 'game_type', 'trophy_grade', 'trophy_change'],
        raw: true
    }).then((result) => {
        const membersJson = members.map(item => {
            return {
                id: item.id,
                battles: []
            }
        });

        membersJson.map(items => {
            result.map(item => {
                item.member_id === items.id ? items.battles.push(JSON.parse(item.json)) : "";
            })
        })

        return membersJson
    });

    const season = await Season.findOne({
        order: [['start_date', 'DESC']],
        raw: true,
    }).then((result) => {
        return result
    });

    const rotation = await Rotation.findAll({
        raw: true,
    }).then((result) => {
        return result
    });

    res.send({
        members: members,
        battleLog: battleLog,
        season: season,
        rotation: rotation
    });
});

router.get('/friend', (req, res) => {
    res.render('blossom/friend', {
        title: 'Express'
    });
});

router.get('/update', (req, res) => {
    res.render('blossom/update', {
        title: 'Express'
    });
});

export default router;