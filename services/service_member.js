import fetch from "node-fetch";
import config from "../config/config.js";
import crewJSON from "../public/json/crew.json" assert {type: "json"};

import {col, fn, literal, Op} from "sequelize";
import Battle from "../models/battle.js";
import Member from "../models/member.js";
import MemberBrawler from "../models/member_brawler.js";
import Brawler from "../models/brawler.js";
import Record from "../models/record.js";
import Friend from "../models/friend.js";
import Map from "../models/map.js";
import Season from "../models/season.js";

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
            method: 'GET',
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
        const season = await Season.findOne({
            order: [['begin_date', 'DESC']],
        });

        const setLeagueRank = (typeNum, tag, column) => {
            return Battle.findOne({
                attributes: ['brawler_trophy'],
                where: {
                    member_id: tag,
                    player_id: tag,
                    match_type: typeNum,
                },
                order: [[column, 'DESC']],
            }).then(result => {
                return result != null ? result.brawler_trophy - 1 : 0;
            });
        };

        const setTrophyBegin = (tag, brawlerID, current) => {
            return Battle.findOne({
                attributes: ['brawler_trophy'],
                where: {
                    member_id: tag,
                    player_id: tag,
                    brawler_id: brawlerID,
                    match_type: 0,
                    match_date: {
                        [Op.between]: [season.begin_date, season.end_date]
                    },
                }
            }).then(result => {
                return result != null ? result.brawler_trophy : current;
            });
        };

        const setMatchCount = (tag, brawlerID) => {
            return Battle.findOne({
                attributes: [
                    [
                        fn("COUNT",
                            literal("CASE WHEN match_type = 0 THEN 1 END")
                        ), "match_trophy"
                    ],
                    [
                        fn("COUNT",
                            literal("CASE WHEN match_type IN (2, 3) THEN 1 END")
                        ), "match_league"
                    ],
                    [
                        fn("COUNT",
                            literal("CASE WHEN match_result = -1 AND match_type = 0 THEN 1 END")
                        ), "victory_trophy"
                    ],
                    [
                        fn("COUNT",
                            literal("CASE WHEN match_result = -1 AND match_type IN (2, 3) THEN 1 END")
                        ), "victory_league"
                    ],
                    [
                        fn("COUNT",
                            literal("CASE WHEN match_result = 1 AND match_type = 0 THEN 1 END")
                        ), "defeat_trophy"
                    ],
                    [
                        fn("COUNT",
                            literal("CASE WHEN match_result = 1 AND match_type IN (2, 3) THEN 1 END")
                        ), "defeat_league"
                    ],
                ],
                where: {
                    member_id: tag,
                    player_id: tag,
                    brawler_id: brawlerID
                },
                raw: true
            }).then(result => {
                return [result.match_trophy, result.match_league, result.victory_trophy, result.victory_league, result.defeat_trophy, result.defeat_league];
            });
        };

        const responseMember = await fetch(`${config.url}/players/${member.replace('#', '%23')}`, {
            method: 'GET',
            headers: config.headers,
        })
            .then(res => res.json())
            .catch(err => console.error(err));

        if (responseMember.tag !== undefined) {
            const [soloRankCurrent, teamRankCurrent, soloRankHighest, teamRankHighest] =
                await Promise.all([setLeagueRank(2, responseMember.tag, 'match_date'),
                    setLeagueRank(3, responseMember.tag, 'match_date'),
                    setLeagueRank(2, responseMember.tag, 'brawler_trophy'),
                    setLeagueRank(3, responseMember.tag, 'brawler_trophy')]);

            responseMember.name = crewJSON.find(member => member.tag === responseMember.tag) !== undefined ?
                (crewJSON.find(member => member.tag === responseMember.tag).name !== responseMember.name ?
                    `${crewJSON.find(member => member.tag === responseMember.tag).name}(${responseMember.name})`
                    : responseMember.name) : responseMember.name;

            await Member.upsert({
                id: responseMember.tag,
                name: responseMember.name,
                trophy_current: responseMember.trophies,
                trophy_highest: responseMember.highestTrophies,
                victory_triple: responseMember['3vs3Victories'],
                victory_duo: responseMember.duoVictories,
                rank_25: responseMember.brawlers.filter((trophy) => trophy.highestTrophies >= 750).length,
                rank_30: responseMember.brawlers.filter((trophy) => trophy.highestTrophies >= 1000).length,
                rank_35: responseMember.brawlers.filter((trophy) => trophy.highestTrophies >= 1250).length,
                league_solo_current: soloRankCurrent,
                league_solo_highest: soloRankHighest,
                league_team_current: teamRankCurrent,
                league_team_highest: teamRankHighest,
                club_tag: responseMember.club.tag,
                profile_picture: responseMember.icon.id
            });

            const brawlerList = responseMember.brawlers;
            for (const brawler of brawlerList) {
                const brawlerID = brawler.id;
                const brawlerPower = brawler.power;
                const trophyBegin = await setTrophyBegin(responseMember.tag, brawlerID, brawler.trophies);
                const [matchTrophy, matchLeague, victoryTrophy, victoryLeague, defeatTrophy, defeatLeague] =
                    await setMatchCount(responseMember.tag, brawlerID);

                await MemberBrawler.upsert({
                    member_id: responseMember.tag,
                    brawler_id: brawlerID,
                    power: brawlerPower,
                    trophy_begin: trophyBegin,
                    trophy_current: brawler.trophies,
                    trophy_highest: brawler.highestTrophies,
                    trophy_rank: brawler.rank,
                    match_trophy: matchTrophy,
                    match_league: matchLeague,
                    victory_trophy: victoryTrophy,
                    victory_league: victoryLeague,
                    defeat_trophy: defeatTrophy,
                    defeat_league: defeatLeague
                });
            }
        }
    }

    /** 목록에 제외된 멤버 정보 삭제
     * @param members 멤버 목록
     */
    static deleteMembers = async (members) => {
        await Member.destroy({
            where: {
                id: {
                    [Op.notIn]: members,
                }
            },
        });

        await MemberBrawler.destroy({
            where: {
                member_id: {
                    [Op.notIn]: members,
                }
            },
        });
    }

    static selectMembersSummary = async () => {
        return await Member.findAll({
            attributes: ["id", "name", "trophy_current", "league_solo_current", "league_team_current"],
            order: [["trophy_current", "DESC"]]
        });
    };

    static async selectMemberDetail(id, beginDate, endDate) {
        const season = await Season.findOne({
            order: [['begin_date', 'DESC']]
        });

        const member = await Member.findOne({
            where: {
                id: `#${id}`
            }
        });

        const battles = await Battle.findAll({
            include: [
                {
                    model: Map,
                    required: true,
                    attributes: []
                },
            ],
            attributes: ['match_date', 'brawler_id', 'match_type',
                'match_rank', 'match_result', 'Map.mode'],
            where: {
                member_id: `#${id}`,
                player_id: `#${id}`,
                match_date: {
                    [Op.between]: [beginDate, endDate]
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
                member_id: `#${id}`,
                season_id: season.id
            },
            order: [['match_count', 'DESC']]
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
                result.filter(item => item.match_type === '0').map(item => parseInt(item.match_change))
                    .reduce((trophy, total) => trophy + total) : 0;

            records.trophyLeague = result.filter(item => item.match_type === '0');
            records.soloPowerLeague = result.filter(item => item.match_type === '2');
            records.teamPowerLeague = result.filter(item => item.match_type === '3');
            return records;
        });

        const dailyCount = await Battle.findOne({
            attributes: [[fn("COUNT", literal('CASE WHEN match_result = -1 THEN 1 END')), 'victory_count'],
                [fn("COUNT", literal('CASE WHEN match_result = 0 THEN 1 END')), 'draw_count'],
                [fn("COUNT", literal('CASE WHEN match_result = 1 THEN 1 END')), 'defeat_count']],
            where: {
                member_id: `#${id}`,
                player_id: `#${id}`,
                match_date: {
                    [Op.between]: [beginDate, endDate]
                },
            },
            order: [['match_date', 'DESC']]
        });

        const seasonCount = await Record.findOne({
            attributes: [
                [fn("SUM", col("match_count")), 'match_count'],
                [fn("SUM", col("victory_count")), 'victory_count'],
                [fn("SUM", col("defeat_count")), 'defeat_count']],
            where: {
                member_id: `#${id}`,
                season_id: season.id
            }
        });

        const friendsPoint = await Friend.findOne({
            attributes: [
                'member_id',
                [fn('SUM', col('point')), 'total_point']
            ],
            where: {
                member_id: `#${id}`,
                season_id: season.id
            },
            group: ['member_id']
        });

        const friendsGroup = await Friend.findAll({
            attributes: [
                'member_id',
                'friend_id',
                'friend_name',
                [fn('SUM', col('point')), 'friend_point'],
                [fn('SUM', col('match_count')), 'match_count'],
                [fn('SUM', col('victory_count')), 'victory_count'],
                [fn('SUM', col('defeat_count')), 'defeat_count'],
            ],
            where: {
                member_id: `#${id}`,
                season_id: season.id
            },
            group: ['friend_id', 'friend_name'],
            order: [['friend_point', 'DESC']]
        });

        const friends = await Friend.findAll({
            where: {
                member_id: `#${id}`,
                season_id: season.id
            },
            order: [['point', 'DESC']]
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
                member_id: `#${id}`,
            },
            order: [['trophy_current', 'DESC']],
            raw: true
        });

        return [member, battles, records, season, dailyCount, seasonCount, friendsGroup, friendsPoint, friends, brawlers];
    }
}