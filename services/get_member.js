import sequelize, {Op} from 'sequelize';
import fetch from 'node-fetch';
import Member from '../models/member.js';
import BattleLog from '../models/battle.js';
import MemberBrawler from '../models/member_brawler.js';
import config from '../config/config.js';

const url = `https://api.brawlstars.com/v1`;

export default async (members) => {
    console.log('🌸 GET START : MEMBER');

    const setLeagueRank = (typeNum, tag, column) => {
        return BattleLog.findOne({
            attributes: ['brawler_trophy'],
            where: {
                id: {[Op.like]: `%_${tag}_${tag}_%`},
                match_type: typeNum,
            },
            order: [[column, 'DESC']],
        }).then(result => {
            return result != null ? result.brawler_trophy - 1 : 0;
        });
    }

    const setTrophyBegin = (tag, brawlerID) => {
        return BattleLog.findOne({
            attributes: ['brawler_trophy'],
            where: {
                id: {[Op.like]: `%_${tag}_${tag}_%`},
                brawler_id: brawlerID,
                match_type: 0
            }
        }).then(result => {
            return result != null ? result.brawler_trophy : -1;
        });
    }

    const setMatchCount = (tag, brawlerID) => {
        return BattleLog.findOne({
            attributes: [
                [
                    sequelize.literal(`(select count(*) from battle where match_type = 0 and id like '%_${tag}_${tag}' and brawler_id = '${brawlerID}')`), `match_trophy`,
                ], [
                    sequelize.literal(`(select count(*) from battle where match_type in (2, 3) and id like '%_${tag}_${tag}' and brawler_id = '${brawlerID}')`), `match_league`
                ], [
                    sequelize.literal(`(select count(*) from battle where match_result = 0 and match_type = 0 and id like '%_${tag}_${tag}' and brawler_id = '${brawlerID}')`), `victory_trophy`,
                ], [
                    sequelize.literal(`(select count(*) from battle where match_result = 0 and match_type in (2, 3) and id like '%_${tag}_${tag}' and brawler_id = '${brawlerID}')`), `victory_league`
                ]
            ],
            raw: true
        }).then(result => {
            const matchTrophy = result.match_trophy != null ? result.match_trophy : 0;
            const matchLeague = result.match_league != null ? result.match_league : 0;
            const victoryTrophy = result.victory_trophy != null ? result.victory_trophy : 0;
            const victoryLeague = result.victory_league != null ? result.victory_league : 0;
            return [matchTrophy, matchLeague, victoryTrophy, victoryLeague];
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
                await Promise.all([setLeagueRank(2, responseMember.tag, 'id'),
                    setLeagueRank(3, responseMember.tag, 'id'),
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
                league_team_highest: teamRankHighest
            });

            const brawlerList = responseMember.brawlers;
            for (const brawler of brawlerList) {
                const brawlerID = brawler.id;
                const brawlerPower = brawler.power;
                const trophyBegin = await setTrophyBegin(responseMember.tag, brawlerID);
                const trophyCurrent = brawler.trophies;
                const trophyHighest = brawler.highestTrophies;
                const [matchTrophy, matchLeague, victoryTrophy, victoryLeague] = await setMatchCount(responseMember.tag, brawlerID);

                await MemberBrawler.upsert({
                    id: `${responseMember.tag}_${brawlerID}`,
                    member_id: responseMember.tag,
                    brawler_id: brawlerID,
                    power: brawlerPower,
                    trophy_begin: trophyBegin,
                    trophy_current: trophyCurrent,
                    trophy_highest: trophyHighest,
                    match_trophy: matchTrophy,
                    match_league: matchLeague,
                    victory_trophy: victoryTrophy,
                    victory_league: victoryLeague
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