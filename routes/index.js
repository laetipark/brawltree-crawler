import express from 'express';
import {col, fn, Op} from 'sequelize';
import Member from '../models/member.js';
import Brawler from '../models/brawler.js';
import MemberBrawler from '../models/member_brawler.js';
import Pick from '../models/pick.js';
import Battles from '../models/battle.js';
import Rotation from '../models/rotation.js';
import Season from '../models/season.js';
import Record from "../models/record.js";
import Friend from "../models/friend.js";

const router = express.Router();

const typeFilter = {
    filter: ['all', 'trophyLeague', 'powerLeague', 'clubLeague', 'challenge'],
    all: [0, 2, 3, 4, 5, 6],
    trophyLeague: [0],
    powerLeague: [2, 3],
    clubLeague: [6],
    challenge: [4, 5]
};
const modeFilter = ['gemGrab', 'brawlBall', 'bounty', 'heist', 'hotZone', 'knockout', 'duels', 'soloShowdown', 'duoShowdown'];

router.get('/', async (req, res) => {

});

router.get('/rotation', async (req, res) => {

});

/*router.get('/battle', async (req, res) => {
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

    const battleLog = await Battles.findAll({

    }).then((res) => {
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
});*/

export default router;