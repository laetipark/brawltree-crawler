import fetch from "node-fetch";
import config from "../config/config.js";
import crewJSON from "../public/json/crew.json" assert {type: "json"};

import {col, fn, literal, Op} from "sequelize";
import Battle from "../models/table_battle.js";
import Member from "../models/table_member.js";
import MemberBrawler from "../models/table_member_brawler.js";
import MemberFriend from "../models/table_member_friend.js";
import MemberRecord from "../models/table_member_record.js";
import InfoBrawler from "../models/view_info_brawler.js";
import InfoMap from "../models/view_info_map.js";
import InfoSeason from "../models/view_info_season.js";

export class memberService {

    /** 멤버 정보 최신화 */
    static updateMembers = async () => {

        function removeDuplicates(array) {
            const arr = array.concat()
            for (let i = 0; i < arr.length; ++i) {
                for (let j = i + 1; j < arr.length; ++j) {
                    if (arr[i] === arr[j]) {
                        arr.splice(j, 1);
                    }
                }
            }
            return arr;
        }

        const club = await fetch(`${config.url}/clubs/%23C2RCY8C2/members`, {
            method: "GET",
            headers: config.headers,
        }).then(res => {
            return res.json();
        });

        const crew = crewJSON.map(crew => crew.tag);

        return removeDuplicates(club.items.map(club => club.tag).concat(crew));
    }

    /** 멤버 기록과 소유 브롤러 정보 데이터베이스에 추가
     * @param member 멤버 태그
     */
    static insertMember = async (member) => {
        const season = await InfoSeason.findOne({
            order: [["SEASON_BGN_DT", "DESC"]],
        });

        const setLeagueRank = (typeNum, tag, column) => {
            return Battle.findOne({
                attributes: ["BRAWLER_TRP"],
                where: {
                    MEMBER_ID: tag,
                    PLAYER_ID: tag,
                    MATCH_TYP: typeNum,
                },
                order: [[column, "DESC"]],
            }).then(result => {
                return result != null ? result.BRAWLER_TRP - 1 : 0;
            });
        };

        const setTrophyBegin = (tag, brawlerID, current) => {
            return Battle.findOne({
                attributes: ["BRAWLER_TRP"],
                where: {
                    MEMBER_ID: tag,
                    PLAYER_ID: tag,
                    BRAWLER_ID: brawlerID,
                    MATCH_TYP: 0,
                    MATCH_DT: {
                        [Op.gt]: [season.SEASON_BGN_DT]
                    },
                }
            }).then(result => {
                return result != null ? result.BRAWLER_TRP : current;
            });
        };

        const setMatchCount = (tag, brawlerID) => {
            return Battle.findOne({
                attributes: [
                    [
                        fn("COUNT",
                            literal("CASE WHEN MATCH_TYP = 0 THEN 1 END")
                        ), "MATCH_CNT_TL"
                    ],
                    [
                        fn("COUNT",
                            literal("CASE WHEN MATCH_TYP IN (2, 3) THEN 1 END")
                        ), "MATCH_CNT_PL"
                    ],
                    [
                        fn("COUNT",
                            literal("CASE WHEN MATCH_RES = -1 AND MATCH_TYP = 0 THEN 1 END")
                        ), "MATCH_CNT_VIC_TL"
                    ],
                    [
                        fn("COUNT",
                            literal("CASE WHEN MATCH_RES = -1 AND MATCH_TYP IN (2, 3) THEN 1 END")
                        ), "MATCH_CNT_VIC_PL"
                    ],
                    [
                        fn("COUNT",
                            literal("CASE WHEN MATCH_RES = 1 AND MATCH_TYP = 0 THEN 1 END")
                        ), "MATCH_CNT_DEF_TL"
                    ],
                    [
                        fn("COUNT",
                            literal("CASE WHEN MATCH_RES = 1 AND MATCH_TYP IN (2, 3) THEN 1 END")
                        ), "MATCH_CNT_DEF_PL"
                    ],
                ],
                where: {
                    MEMBER_ID: tag,
                    PLAYER_ID: tag,
                    BRAWLER_ID: brawlerID
                },
                raw: true
            }).then(result => {
                return [result.MATCH_CNT_TL, result.MATCH_CNT_PL, result.MATCH_CNT_VIC_TL, result.MATCH_CNT_VIC_PL, result.MATCH_CNT_DEF_TL, result.MATCH_CNT_DEF_PL];
            });
        };

        const responseMember = await fetch(`${config.url}/players/${member.replace("#", "%23")}`, {
            method: "GET",
            headers: config.headers,
        })
            .then(res => res.json())
            .catch(err => console.error(err));

        if (responseMember.tag !== undefined) {
            const [soloRankCurrent, teamRankCurrent, soloRankHighest, teamRankHighest] =
                await Promise.all([setLeagueRank(2, responseMember.tag, "MATCH_DT"),
                    setLeagueRank(3, responseMember.tag, "MATCH_DT"),
                    setLeagueRank(2, responseMember.tag, "BRAWLER_TRP"),
                    setLeagueRank(3, responseMember.tag, "BRAWLER_TRP")]);

            responseMember.name = crewJSON.find(member => member.tag === responseMember.tag) !== undefined ?
                (crewJSON.find(member => member.tag === responseMember.tag).name !== responseMember.name ?
                    `${crewJSON.find(member => member.tag === responseMember.tag).name}(${responseMember.name})`
                    : responseMember.name) : responseMember.name;

            await Member.upsert({
                MEMBER_ID: responseMember.tag,
                MEMBER_NM: responseMember.name,
                MEMBER_PROFILE: responseMember.icon.id,
                TROPHY_CUR: responseMember.trophies,
                TROPHY_HGH: responseMember.highestTrophies,
                VICTORY_TL: responseMember["3vs3Victories"],
                VICTORY_DUO: responseMember.duoVictories,
                BRAWLER_RNK_25: responseMember.brawlers.filter((trophy) => trophy.highestTrophies >= 750).length,
                BRAWLER_RNK_30: responseMember.brawlers.filter((trophy) => trophy.highestTrophies >= 1000).length,
                BRAWLER_RNK_35: responseMember.brawlers.filter((trophy) => trophy.highestTrophies >= 1250).length,
                PL_SL_CUR: soloRankCurrent,
                PL_SL_HGH: soloRankHighest,
                PL_TM_CUR: teamRankCurrent,
                PL_TM_HGH: teamRankHighest,
                CLUB_ID: responseMember.club.tag
            });

            const brawlerList = responseMember.brawlers;
            for (const brawler of brawlerList) {
                const brawlerID = brawler.id;
                const brawlerPower = brawler.power;
                const trophyBegin = await setTrophyBegin(responseMember.tag, brawlerID, brawler.trophies);
                const [matchTrophy, matchLeague, victoryTrophy, victoryLeague, defeatTrophy, defeatLeague] =
                    await setMatchCount(responseMember.tag, brawlerID);

                await MemberBrawler.upsert({
                    MEMBER_ID: responseMember.tag,
                    BRAWLER_ID: brawlerID,
                    BRAWLER_PWR: brawlerPower,
                    TROPHY_BGN: trophyBegin,
                    TROPHY_CUR: brawler.trophies,
                    TROPHY_HGH: brawler.highestTrophies,
                    TROPHY_RNK: brawler.rank,
                    MATCH_CNT_TL: matchTrophy,
                    MATCH_CNT_PL: matchLeague,
                    MATCH_CNT_VIC_TL: victoryTrophy,
                    MATCH_CNT_VIC_PL: victoryLeague,
                    MATCH_CNT_DEF_TL: defeatTrophy,
                    MATCH_CNT_DEF_PL: defeatLeague
                });
            }
        }
    }

    static updateFriends = async (members, member) => {

        const season = await InfoSeason.findOne({
            order: [["SEASON_BGN_DT", "DESC"]],
        });

        const memberPLTeam = await Member.findOne({
            attributes: ["PL_TM_CUR"],
            where: {
                MEMBER_ID: member
            }
        })

        const friends = await Battle.findAll({
            include: [
                {
                    model: InfoMap,
                    required: true,
                    attributes: []
                },
            ],
            attributes: ["MEMBER_ID", "PLAYER_ID", "MATCH_TYP", "MATCH_GRD", "PLAYER_NM",
                [fn("COUNT", "*"), "MATCH_CNT"],
                [fn("COUNT", literal("CASE WHEN MATCH_RES = -1 THEN 1 END")), "MATCH_CNT_VIC"],
                [fn("COUNT", literal("CASE WHEN MATCH_RES = 1 THEN 1 END")), "MATCH_CNT_DEF"],
                [fn("ROUND", fn("SUM",
                    literal("CASE WHEN MATCH_RES = -1 THEN 0.005 * CAST(MATCH_GRD AS UNSIGNED) WHEN MATCH_RES = 0 THEN 0.0025 * CAST(MATCH_GRD AS UNSIGNED)  ELSE 0.001 * CAST(MATCH_GRD AS UNSIGNED) END")), 2), "FRIEND_PT"],
                [col("InfoMap.MAP_MD"), "MAP_MD"],
            ],
            where: {
                MEMBER_ID: member,
                PLAYER_ID: {
                    [Op.and]: {
                        [Op.not]: member,
                        [Op.in]: members
                    }
                },
                MATCH_DT: {
                    [Op.gt]: season.SEASON_BGN_DT
                },
                [Op.or]: {
                    MATCH_TYP: 0,
                    [Op.and]: {
                        MATCH_TYP: 3,
                        MATCH_GRD: {
                            [Op.lte]: memberPLTeam.PL_TM_CUR
                        }
                    }
                }
            },
            group: ["MEMBER_ID", "PLAYER_ID", "MATCH_TYP", "MATCH_GRD", "PLAYER_NM", "MAP_MD"],
            raw: true,
        });

        for (const friend of friends) {
            await MemberFriend.upsert({
                MEMBER_ID: friend.MEMBER_ID,
                FRIEND_ID: friend.PLAYER_ID,
                MAP_MD: friend.MAP_MD,
                MATCH_TYP: friend.MATCH_TYP,
                MATCH_GRD: friend.MATCH_GRD,
                FRIEND_NM: friend.PLAYER_NM,
                FRIEND_PT: friend.FRIEND_PT,
                MATCH_CNT: friend.MATCH_CNT,
                MATCH_CNT_VIC: friend.MATCH_CNT_VIC,
                MATCH_CNT_DEF: friend.MATCH_CNT_DEF
            });
        }
    };

    static updateRecords = async (member) => {
        const season = await InfoSeason.findOne({
            order: [["SEASON_BGN_DT", "DESC"]],
        });

        const memberPLTeam = await Member.findOne({
            attributes: ["PL_SL_CUR", "PL_TM_CUR"],
            where: {
                MEMBER_ID: member
            }
        })

        const records = await Battle.findAll({
            include: [
                {
                    model: InfoMap,
                    required: true,
                    attributes: []
                },
            ],
            attributes: ["MEMBER_ID", "MATCH_TYP", "MATCH_GRD",
                [fn("SUM", literal("CASE WHEN MATCH_TYP = 0 THEN MATCH_CHG + RAW_CHG ELSE 0 END")), "MATCH_CHG"],
                [fn("COUNT", "*"), "MATCH_CNT"],
                [fn("COUNT", literal("CASE WHEN MATCH_RES = -1 THEN 1 END")), "MATCH_CNT_VIC"],
                [fn("COUNT", literal("CASE WHEN MATCH_RES = 1 THEN 1 END")), "MATCH_CNT_DEF"],
                [col("InfoMap.MAP_MD"), "MAP_MD"],
            ],
            where: {
                [Op.or]: [
                    {
                        MEMBER_ID: member,
                        PLAYER_ID: member,
                        MATCH_DT: {
                            [Op.gt]: season.SEASON_BGN_DT
                        },
                    },
                    {
                        MEMBER_ID: member,
                        PLAYER_ID: member,
                        MATCH_DT: {
                            [Op.gt]: season.SEASON_BGN_DT
                        },
                        MATCH_TYP: 3,
                        MATCH_GRD: {
                            [Op.lte]: memberPLTeam.PL_TM_CUR
                        }
                    }
                ]
            },
            group: ["MEMBER_ID", "MATCH_TYP", "MATCH_GRD", "MAP_MD"],
            raw: true
        });

        for (const record of records) {
            await MemberRecord.upsert({
                MEMBER_ID: record.MEMBER_ID,
                MAP_MD: record.MAP_MD,
                MATCH_TYP: record.MATCH_TYP,
                MATCH_GRD: record.MATCH_GRD,
                MATCH_CHG: record.MATCH_CHG,
                MATCH_CNT: record.MATCH_CNT,
                MATCH_CNT_VIC: record.MATCH_CNT_VIC,
                MATCH_CNT_DEF: record.MATCH_CNT_DEF
            });
        }
    };

    /** 목록에 제외된 멤버 정보 삭제
     * @param members 멤버 목록
     */
    static deleteMembers = async (members) => {
        await Member.destroy({
            where: {
                MEMBER_ID: {
                    [Op.notIn]: members,
                }
            },
        });

        await MemberBrawler.destroy({
            where: {
                MEMBER_ID: {
                    [Op.notIn]: members,
                }
            },
        });
    };

    static selectMembersSummary = async () => {
        return await Member.findAll({
            attributes: ["MEMBER_ID", "MEMBER_NM", "TROPHY_CUR", "PL_SL_CUR", "PL_TM_CUR"],
            order: [["TROPHY_CUR", "DESC"]]
        });
    };

    static async selectMemberDetail(id, beginDate, endDate) {
        const season = await InfoSeason.findOne({
            order: [["SEASON_BGN_DT", "DESC"]]
        });

        const member = await Member.findOne({
            where: {
                MEMBER_ID: `#${id}`
            }
        });

        const battles = await Battle.findAll({
            include: [
                {
                    model: InfoMap,
                    required: true,
                    attributes: []
                },
            ],
            attributes: ["MATCH_DT", "BRAWLER_ID", "MATCH_TYP",
                "MATCH_RNK", "MATCH_RES", "InfoMap.MAP_MD"],
            where: {
                MEMBER_ID: `#${id}`,
                PLAYER_ID: `#${id}`,
                MATCH_DT: {
                    [Op.between]: [beginDate, endDate]
                },
            },
            order: [["MATCH_DT", "DESC"]],
            raw: true
        }).then((result) => {
            return result.reduce((acc, current) => {
                if (acc.findIndex(({MATCH_DT}) =>
                    JSON.stringify(MATCH_DT) === JSON.stringify(current.MATCH_DT)) === -1) {
                    acc.push(current);
                }
                return acc;
            }, []);
        });

        const records = await MemberRecord.findAll({
            where: {
                MEMBER_ID: `#${id}`,

            },
            order: [["MATCH_CNT", "DESC"]]
        }).then((result) => {
            const records = {
                mapMode: {
                    gemGrab: {}, brawlBall: {},
                    bounty: {}, heist: {}, hotZone: {}, knockout: {},
                    basketBrawl: {}, volleyBrawl: {}, duels: {},
                    soloShowdown: {}, duoShowdown: {}
                },
                trophyLeague: [],
                soloPowerLeague: [],
                teamPowerLeague: []
            };
            for (const mode of config.modeList) {
                const mapMode = result.filter(item => item.MAP_MD === mode);

                if (mapMode.length !== 0 && records.mapMode[`${mode}`] !== undefined) {
                    records.mapMode[`${mode}`].MATCH_CNT =
                        mapMode.map(item => item.MATCH_CNT)
                            .reduce((count, total) => count + total);
                    records.mapMode[`${mode}`].MATCH_CNT_VIC =
                        mapMode.map(item => item.MATCH_CNT_VIC)
                            .reduce((count, total) => count + total);
                    records.mapMode[`${mode}`].MATCH_CNT_DEF =
                        mapMode.map(item => item.MATCH_CNT_DEF)
                            .reduce((count, total) => count + total);
                }
            }

            records.matchChange = result.filter(item => item.MATCH_TYP === "0").length > 0 ?
                result.filter(item => item.MATCH_TYP === "0").map(item => parseInt(item.MATCH_CHG))
                    .reduce((trophy, total) => trophy + total) : 0;

            records.trophyLeague = result.filter(item => item.MATCH_TYP === "0");
            records.soloPowerLeague = result.filter(item => item.MATCH_TYP === "2");
            records.teamPowerLeague = result.filter(item => item.MATCH_TYP === "3");
            return records;
        });

        const dailyCount = await Battle.findOne({
            attributes: [[fn("COUNT", literal("CASE WHEN MATCH_RES = -1 THEN 1 END")), "MATCH_CNT_VIC"],
                [fn("COUNT", literal("CASE WHEN MATCH_RES = 0 THEN 1 END")), "MATCH_CNT_DRW"],
                [fn("COUNT", literal("CASE WHEN MATCH_RES = 1 THEN 1 END")), "MATCH_CNT_DEF"]],
            where: {
                MEMBER_ID: `#${id}`,
                PLAYER_ID: `#${id}`,
                MATCH_DT: {
                    [Op.between]: [beginDate, endDate]
                },
            },
            order: [["MATCH_DT", "DESC"]]
        });

        const seasonCount = await MemberRecord.findOne({
            attributes: [
                [fn("SUM", col("MATCH_CNT")), "MATCH_CNT"],
                [fn("SUM", col("MATCH_CNT_VIC")), "MATCH_CNT_VIC"],
                [fn("SUM", col("MATCH_CNT_DEF")), "MATCH_CNT_DEF"]],
            where: {
                MEMBER_ID: `#${id}`,
            }
        });

        const friendsPoint = await MemberFriend.findOne({
            attributes: [
                "MEMBER_ID",
                [fn("SUM", col("FRIEND_PT")), "FRIEND_PT_TOT"]
            ],
            where: {
                MEMBER_ID: `#${id}`
            },
            group: ["MEMBER_ID"]
        });

        const friendsGroup = await MemberFriend.findAll({
            attributes: [
                "MEMBER_ID",
                "FRIEND_ID",
                "FRIEND_NM",
                [fn("SUM", col("FRIEND_PT")), "FRIEND_PT"],
                [fn("SUM", col("MATCH_CNT")), "MATCH_CNT"],
                [fn("SUM", col("MATCH_CNT_VIC")), "MATCH_CNT_VIC"],
                [fn("SUM", col("MATCH_CNT_DEF")), "MATCH_CNT_DEF"],
            ],
            where: {
                MEMBER_ID: `#${id}`
            },
            group: ["FRIEND_ID", "FRIEND_NM"],
            order: [["FRIEND_PT", "DESC"]]
        });

        const friends = await MemberFriend.findAll({
            where: {
                MEMBER_ID: `#${id}`,

            },
            order: [["FRIEND_PT", "DESC"]]
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
                [col("InfoBrawler.BRAWLER_NM"), "BRAWLER_NM"]
            ],
            where: {
                MEMBER_ID: `#${id}`,
            },
            order: [["TROPHY_CUR", "DESC"]],
            raw: true
        });

        return [member, battles, records, season, dailyCount, seasonCount, friendsGroup, friendsPoint, friends, brawlers];
    };


    static selectSeasonSummary = async (type, mode) => {

        const matchType = config.typeList.filter.includes(type) ? config.typeList[`${type}`] : config.typeList.all;
        const matchMode = config.modeList.includes(mode) ? Array(mode) : config.modeList;

        const season = await InfoSeason.findOne({
            order: [['SEASON_BGN_DT', 'DESC']]
        });


        const record = await MemberRecord.findAll({
            include: [
                {
                    model: Member,
                    required: true,
                    attributes: []
                },
            ],
            attributes: ["MEMBER_ID",
                [fn("SUM", col("MATCH_CHG")), "MATCH_CHG"],
                [fn("SUM", col("MATCH_CNT")), "MATCH_CNT"],
                [col("Member.MEMBER_NM"), "MEMBER_NM"]],
            where: {
                MAP_MD: matchMode,
                MATCH_TYP: matchType
            },
            group: ["MEMBER_ID"],
            order: [["MATCH_CNT", "DESC"]],
            raw: true
        });

        const friend = await MemberFriend.findAll({
            include: [
                {
                    model: Member,
                    required: true,
                    attributes: []
                },
            ],
            attributes: ["MEMBER_ID",
                [fn("ROUND", fn("SUM", col("FRIEND_PT")), 2), "FRIEND_PT"]],
            where: {
                MAP_MD: matchMode,
                MATCH_TYP: matchType
            },
            group: ["MEMBER_ID"],
            raw: true
        });

        const members = record.map(memberRecord => {
            const matched = friend.find(memberFriend =>
                memberRecord.MEMBER_ID === memberFriend.MEMBER_ID);
            if (matched) {
                return {...memberRecord, ...matched}
            } else {
                return {
                    ...memberRecord,
                    ...{
                        MEMBER_ID: memberRecord.MEMBER_ID,
                        FRIEND_PT: 0
                    }
                }
            }
        });

        return [season, members];
    };
}