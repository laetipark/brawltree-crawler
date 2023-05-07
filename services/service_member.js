import {fn, literal, Op} from "sequelize";
import fetch from "node-fetch";
import config from "../config/config.js";
import crewJSON from "../public/json/crew.json" assert {type: "json"};

import Battle from "../models/battle.js";
import Member from "../models/member.js";
import MemberBrawler from "../models/member_brawler.js";
import Record from "../models/record.js";
import Friend from "../models/friend.js";
import Season from "../models/season.js";
import crewJson from "../public/json/crew.json";

export class memberService {

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

        const crew = crewJson.map(crew => crew.tag);

        return removeDuplicates(club.items.map(club => club.tag).concat(crew));
    }

    static insertMember = async (member) => {
        const season = await Season.findOne({
            raw: true,
            order: [['start_date', 'DESC']],
        }).then(result => {
            return result;
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
                        [Op.between]: [season.start_date, season.end_date]
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
                `${responseMember.name}(${crewJSON.find(member => member.tag === responseMember.tag).name})` : responseMember.name;

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

        await Record.destroy({
            where: {
                member_id: {
                    [Op.notIn]: members,
                }
            },
        });

        await Friend.destroy({
            where: {
                [Op.or]: {
                    member_id: {
                        [Op.notIn]: members,
                    },
                    friend_id: {
                        [Op.notIn]: members,
                    }
                }
            }
        });
    }
}