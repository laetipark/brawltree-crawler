import sequelize, {Op} from 'sequelize';
import fetch from 'node-fetch';
import Member from '../models/member.js';
import Battle from '../models/battle.js';
import MemberBrawler from '../models/member_brawler.js';
import config from '../config/config.js';
import Season from "../models/season.js";

const url = `https://api.brawlstars.com/v1`;

export default async (members) => {
    console.log('🌸 GET START : MEMBER');

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
    }

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
    }

    const setMatchCount = (tag, brawlerID) => {
        return Battle.findOne({
            attributes: [
                [
                    sequelize.literal(`(select count(*) from battle where match_type = 0 and member_id='${tag}' and player_id='${tag}' and brawler_id = '${brawlerID}')`), `match_trophy`,
                ], [
                    sequelize.literal(`(select count(*) from battle where match_type in (2, 3) and member_id='${tag}' and player_id='${tag}' and brawler_id = '${brawlerID}')`), `match_league`
                ], [
                    sequelize.literal(`(select count(*) from battle where match_result = -1 and match_type = 0 and member_id='${tag}' and player_id='${tag}' and brawler_id = '${brawlerID}')`), `victory_trophy`,
                ], [
                    sequelize.literal(`(select count(*) from battle where match_result = -1 and raw_type in (2, 3) and member_id='${tag}' and player_id='${tag}' and brawler_id = '${brawlerID}')`), `victory_league`
                ], [
                    sequelize.literal(`(select count(*) from battle where match_result = 1 and match_type = 0 and member_id='${tag}' and player_id='${tag}' and brawler_id = '${brawlerID}')`), `defeat_trophy`,
                ], [
                    sequelize.literal(`(select count(*) from battle where match_result = 1 and raw_type in (2, 3) and member_id='${tag}' and player_id='${tag}' and brawler_id = '${brawlerID}')`), `defeat_league`
                ]
            ],
            raw: true
        }).then(result => {
            const matchTrophy = result.match_trophy != null ? result.match_trophy : 0;
            const matchLeague = result.match_league != null ? result.match_league : 0;
            const victoryTrophy = result.victory_trophy != null ? result.victory_trophy : 0;
            const victoryLeague = result.victory_league != null ? result.victory_league : 0;
            const defeatTrophy = result.defeat_trophy != null ? result.defeat_trophy : 0;
            const defeatLeague = result.defeat_league != null ? result.defeat_league : 0;
            return [matchTrophy, matchLeague, victoryTrophy, victoryLeague, defeatTrophy, defeatLeague];
        });
    }

    for (const member of members) {
        const memberTag = member.replace('#', '%23');
        const responseMember = await fetch(`${url}/players/${memberTag}`, {
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
};