import express from 'express';
import {fn, col, Op} from 'sequelize';
import Member from '../models/member.js';
import Brawler from '../models/brawler.js';
import MemberBrawler from '../models/member_brawler.js';
import Pick from '../models/pick.js';
import BattleLog from '../models/battle.js';
import Rotation from '../models/rotation.js';
import Season from '../models/season.js';
import Record from "../models/record.js";
import Friend from "../models/friend.js";

const router = express.Router();

router.get('/member', async (req, res) => {
    const members = await Member.findAll({raw: true}).then((result) => {
        return result;
    });

    res.send(members);
});

router.get('/brawler', async (req, res) => {
    const brawlers = await Brawler.findAll({
        raw: true
    }).then((result) => {
        return result;
    });

    const memberBrawlers = await MemberBrawler.findAll({
        raw: true
    }).then((result) => {
        return result;
    });

    const pick = await Pick.findAll({
        raw: true
    }).then((result) => {
        return result;
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
        return result;
    });

    const battleLog = await BattleLog.findAll({
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
            map_id: {
                [Op.in]: filterGameMode.map(item => item.id)
            },
            match_date: {
                [Op.gte]: today,
                [Op.lt]: tomorrow
            },
            match_type: {
                [Op.in]: gameType
            },
        },
        raw: true
    }).then((res) => {

        const groupBy = prop => data => {
            return data.reduce((dict, item) => {
                const {[prop]: _, ...rest} = item;
                dict[item[prop]] = [...(dict[item[prop]] || []), rest];
                return dict;
            }, {});
        };

        const result = Object.entries(groupBy('member_id')(res))
            .map(([key, value]) => ({member_id: key, battles: value}));

        return result;
    });


    const members = await Member.findAll({
        attributes: ["id", "name"],
        raw: true
    }).then((result) => {
        result.map(member => {
            member.battles = battleLog.find((element) => {
                return element.member_id === member.id;
            }) !== undefined ? battleLog.find((element) => {
                return element.member_id === member.id;
            }).battles : null;
        })

        return result.filter(items => {
            return items.battles !== null;
        });
    });


    const season = await Season.findOne({
        order: [['start_date', 'DESC']],
        raw: true,
    }).then((result) => {
        return result;
    });

    const rotation = await Rotation.findAll({
        raw: true,
    }).then((result) => {
        return result;
    });

    res.send({
        members: members,
        season: season,
        rotation: rotation
    });
});

router.get('/season', async (req, res) => {
    const {type} = req.query;
    const {mode} = req.query;
    const gameType = typeFilter.filter.includes(type) ? typeFilter[`${type}`] : typeFilter.all;
    const gameMode = modeFilter.includes(mode) ? Array(mode) : modeFilter;

    const records = await Record.findAll({
        where: {
            match_type: {
                [Op.in]: gameType
            },
            map_mode: {
                [Op.in]: gameMode
            }
        },
        raw: true
    }).then((result) => {
        return result;
    });

    const friends = await Friend.findAll({
        where: {
            match_type: {
                [Op.in]: gameType
            },
            map_mode: {
                [Op.in]: gameMode
            }
        },
        raw: true
    }).then((result) => {
        return result;
    });

    const members = await Member.findAll({
        raw: true
    }).then((result) => {
        result.map(member => {
            const filterRecords = records.filter((element) => {
                return element.member_id === member.id;
            });

            const filterFriends = friends.filter((element) => {
                return element.member_id === member.id;
            });

            const recordMatch = filterRecords.length > 0 ?
                filterRecords.map(item => item.match_count)
                    .reduce((match, total) => match + total) : 0;
            const recordVictory = filterRecords.length > 0 ?
                filterRecords.map(item => item.victory_count)
                    .reduce((victory, total) => victory + total) : 0;
            const recordTrophyChange = filterRecords.length > 0 ?
                filterRecords.map(item => item.match_change)
                    .reduce((trophy, total) => trophy + total) : 0;

            const recordVictoryRate = isNaN(recordVictory / recordMatch) ?
                0 : Math.round((recordVictory / recordMatch) * 10000) / 100.0;

            const friendTotalPoint = filterFriends.length > 0 ?
                filterFriends.map(item => item.point)
                    .reduce((point, total) => point + total).toFixed(2) : 0;

            member.records = filterRecords
            member.friends = filterFriends
            member.record_match = recordMatch;
            member.record_match_change = recordTrophyChange;
            member.record_victory = recordVictory;
            member.record_victory_rate = recordVictoryRate;
            member.friend_total_point = friendTotalPoint;
        });

        result.sort((a, b) => {
            return b.record_match - a.record_match;
        });

        return result;
    });

    const season = await Season.findOne({
        order: [['start_date', 'DESC']],
        raw: true,
    }).then((result) => {
        return result;
    });

    res.send({
        members: members,
        season: season
    });
});

export default router;