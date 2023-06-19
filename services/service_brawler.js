import {col, fn, literal, Op} from "sequelize";
import Battle from "../models/table_battle.js";
import Member from "../models/table_member.js";
import MemberBrawler from "../models/table_member_brawler.js";
import BattlePick from "../models/view_battle_pick.js";
import InfoBrawler from "../models/view_info_brawler.js";
import InfoSeason from "../models/view_info_season.js";

export class brawlerService {
    static selectBrawlers = async () => {
        return await InfoBrawler.findAll();
    }

    static selectBrawlerSummary = async brawler => {
        const season = await InfoSeason.findAll({
            order: [["SEASON_BGN_DT", "DESC"]],
            limit: 2
        }).then(result => {
            return result[1];
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
                attributes: [[col("Member.MEMBER_NM"), "MEMBER_NM"],
                    "MEMBER_ID", "BRAWLER_ID", "TROPHY_CUR", "TROPHY_HGH"],
                where: {
                    BRAWLER_ID: brawler
                },
                order: [["BRAWLER_ID", "ASC"], ["TROPHY_CUR", "DESC"]],
                raw: true,
                logging: true
            });

        const battlePicks =
            await BattlePick.findAll({
                attributes: ["BRAWLER_ID", "MATCH_TYP",
                    [literal("SUM(`MATCH_CNT`) * 100 / SUM(SUM(`MATCH_CNT`)) OVER(PARTITION BY MATCH_TYP)"), "MATCH_CNT_RATE"],
                    [literal("SUM(`MATCH_CNT_VIC`) * 100 / (SUM(`MATCH_CNT_VIC`) + SUM(`MATCH_CNT_DEF`))"), "MATCH_CNT_VIC_RATE"]],
                group: ["BRAWLER_ID", "MATCH_TYP"]
            });

        return [memberBrawlers, battlePicks];
    };

    static selectBrawlersDetail = async (id) => {
        const member = await Member.findOne({
            attributes: ["MEMBER_ID", "MEMBER_NM", "MEMBER_PROFILE", "TROPHY_CUR", "PL_SL_CUR", "PL_TM_CUR"],
            where: {
                MEMBER_ID: `#${id}`,
            }
        });

        const brawlers = await MemberBrawler.findAll({
            include: [
                {
                    model: InfoBrawler,
                    required: true,
                    attributes: []
                }
            ],
            attributes: [
                "MEMBER_ID", "BRAWLER_ID", "BRAWLER_PWR",
                "TROPHY_BGN", "TROPHY_CUR", "TROPHY_HGH", "TROPHY_RNK",
                "MATCH_CNT_TL", "MATCH_CNT_PL",
                "MATCH_CNT_VIC_TL", "MATCH_CNT_VIC_PL",
                "MATCH_CNT_DEF_TL", "MATCH_CNT_DEF_PL",
                [col("InfoBrawler.BRAWLER_NM"), "BRAWLER_NM"],
                [col("InfoBrawler.BRAWLER_RRT"), "BRAWLER_RRT"]
            ],
            where: {
                MEMBER_ID: `#${id}`,
            },
            order: [["MATCH_CNT_TL", "DESC"]],
            raw: true
        });

        const brawlerChange = await Battle.findAll({
            attributes: [
                [fn("DISTINCT", col("BRAWLER_ID")), "BRAWLER_ID"],
                [fn("DATE_FORMAT", col("MATCH_DT"), "%m-%d"), "MATCH_DT"],
                [literal("SUM(`MATCH_CHG`) OVER(PARTITION BY `BRAWLER_ID` ORDER BY DATE(MATCH_DT))"), "MATCH_CHG"]],
            where: {
                MEMBER_ID: `#${id}`,
                PLAYER_ID: `#${id}`,
                MATCH_TYP: 0,
            }
        });

        return [member, brawlers, brawlerChange];
    };
}