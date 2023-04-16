import express from 'express';
import {col, fn, literal} from "sequelize";

import Member from '../models/member.js';
import MemberBrawler from "../models/member_brawler.js";
import Battle from "../models/battle.js";
import Brawler from "../models/brawler.js";
import Pick from "../models/pick.js";

const router = express.Router();

router.get('/', async (req, res) => {
    const {brawler} = req.query;

    const brawlers =
        await Brawler.findAll({
            raw: true
        }).then((result) => {
            return result;
        });

    const memberBrawlers =
        await MemberBrawler.findAll({
            include: [
                {
                    model: Member,
                    required: true,
                    attributes: []
                },
            ],
            attributes: ['member_id', 'brawler_id', 'trophy_current', 'trophy_highest', 'Member.name'],
            where: {
                brawler_id: brawler
            },
            order: [['trophy_current', 'DESC']],
            raw: true
        }).then((result) => {
            return result;
        });

    const pick =
        await Pick.findAll({
            raw: true
        }).then((result) => {
            return result;
        });

    res.send({
        brawlers: brawlers,
        memberBrawlers: memberBrawlers,
        pick: pick
    });
});

router.get('/:id', async (req, res) => {

    const member = await Member.findOne({
        attributes: ['id', 'name', 'trophy_current', 'league_solo_current', 'league_team_current', 'profile_picture'],
        where: {
            id: `#${req.params.id}`,
        },
        raw: true
    }).then((result) => {
        return result;
    });

    const brawlers = await MemberBrawler.findAll({
        include: [
            {
                model: Brawler,
                required: true,
                attributes: ['name', 'rarity']
            }
        ],
        where: {
            member_id: `#${req.params.id}`,
        },
        order: [['match_trophy', 'DESC']],
        raw: true
    }).then((result) => {
        return result;
    });

    const brawlerChange = await Battle.findAll({
        attributes: [
            [fn("distinct", col('brawler_id')),'brawler_id'],
            [fn('date_format', col('match_date'), '%m-%d'), 'match_date'],
            [literal('sum(`match_change`) over(partition by `brawler_id` order by date(match_date))'), 'match_change']],
        where: {
            member_id: `#${req.params.id}`,
            player_id: `#${req.params.id}`,
            match_type: '0',
        },
        raw: true
    }).then((result) => {
        return result;
    });

    res.send({
        member: member,
        brawlers: brawlers,
        brawlerChange: brawlerChange
    });
});

export default router;