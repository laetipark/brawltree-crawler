import brawlerJSON from "../public/json/brawler.json" assert {type: "json"};

import Battle from "../models/battle.js";
import Member from "../models/member.js";
import MemberBrawler from "../models/member_brawler.js";
import Brawler from "../models/brawler.js";
import Pick from "../models/pick.js";
import Season from "../models/season.js";
import {col, fn, literal, Op} from "sequelize";

export class brawlerService {
    static insertBrawler = async () => {
        for (const item of brawlerJSON.items) {
            await Brawler.upsert({
                id: item.id,
                name: item.name,
                rarity: item.rarity,
                class: item.class,
                gender: item.gender,
                icon: item.icon
            });
        }
    };

    static selectBrawlers = async () => {
        return await Brawler.findAll();
    }

    static selectBrawlerSummary = async brawler => {
        const season = await Season.findAll({
            order: [['begin_date', 'DESC']],
            limit: 2
        });

        const memberBrawlers =
            await MemberBrawler.findAll({
                include: [
                    {
                        model: Member,
                        required: true,
                        attributes: ["name"]
                    },
                ],
                attributes: ["Member.name", "member_id", "brawler_id", "trophy_current", "trophy_highest"],
                where: {
                    brawler_id: brawler
                },
                order: [["brawler_id", "ASC"], ["trophy_current", "DESC"]],
                raw: true
            });

        const pick =
            await Pick.findAll({
                where: {
                    season_id: {
                        [Op.between]: [season[1].id, season[0].id]
                    }
                }
            });

        return [memberBrawlers, pick];
    };

    static selectBrawlersDetail = async (id) => {
        const member = await Member.findOne({
            attributes: ['id', 'name', 'trophy_current', 'league_solo_current', 'league_team_current', 'profile_picture'],
            where: {
                id: `#${id}`,
            }
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
                member_id: `#${id}`,
            },
            order: [['match_trophy', 'DESC']],
            raw: true
        });

        const brawlerChange = await Battle.findAll({
            attributes: [
                [fn("DISTINCT", col('brawler_id')), 'brawler_id'],
                [fn('DATE_FORMAT', col('match_date'), '%m-%d'), 'match_date'],
                [literal('SUM(`match_change`) OVER(PARTITION BY `brawler_id` ORDER BY DATE(match_date))'), 'match_change']],
            where: {
                member_id: `#${id}`,
                player_id: `#${id}`,
                match_type: '0',
            }
        });

        return [member, brawlers, brawlerChange];
    };
}