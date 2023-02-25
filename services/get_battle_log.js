import fetch from 'node-fetch';
import BattleLog from '../models/battle_log.js';
import config from '../config/config.js';

const url = `https://api.brawlstars.com/v1`;

const typeNameArray = ['ranked', 'friendly', 'soloRanked', 'teamRanked', 'challenge', 'championshipChallenge'];
const resultNameArray = ['victory', 'draw', 'defeat'];

let comparePlayers;
let isPowerLeague = true;

const setRank = (mode, team) => {
    if (mode === `duoShowdown` || mode === `soloShowdown`) {
        return team;
    } else {
        return -1;
    }
};

const setResult = (mode, teamPlayer, rank, tag, result) => {
    if (mode === `duoShowdown`) {
        if (rank < 2) {
            return 0;
        } else if (rank < 3) {
            return 1;
        } else {
            return 2;
        }
    } else if (mode === `soloShowdown`) {
        if (rank < 4) {
            return 0;
        } else if (rank < 6) {
            return 1;
        } else {
            return 2;
        }
    } else {
        if (teamPlayer.includes(tag)) {
            return resultNameArray.indexOf(result);
        } else {
            if (resultNameArray.indexOf(result) === 0) {
                return 2;
            } else if (resultNameArray.indexOf(result) === 2) {
                return 0;
            } else {
                return 1;
            }
        }
    }
};

const setType = (typeIndex, trophyChange, trophyGrade, currentPlayers, mode) => {
    if (typeIndex === 3 && [3, 5, 7, 9].includes(trophyChange)) {
        comparePlayers = currentPlayers;
        isPowerLeague = false;
        return 6;
    } else if ([1, 2, 3, 4].includes(trophyChange) && trophyGrade <= 27 &&
        !['soloShowdown', 'duoShowdown'].includes(mode)) {
        isPowerLeague = false;
        return 6;
    } else if (comparePlayers === currentPlayers && !isPowerLeague) {
        return 6;
    } else {
        comparePlayers = [];
        isPowerLeague = true;
        return typeIndex;
    }
}

export default async (members) => {
    console.log('🌸 GET START : BATTLE LOG');

    for (const member of members) {
        const memberTag = member.replace('#', '%23')
        const responseBattleLog = await fetch(`${url}/players/${memberTag}/battlelog`, {
            method: 'GET',
            headers: config.headers,
        })
            .then(res => res.json())
            .catch(err => console.error(err));

        if (responseBattleLog.items !== undefined) {
            for (const log of responseBattleLog.items) {
                const dateText = log.battleTime;
                const dateUTC = new Date(Date.UTC(dateText.substring(0, 4), parseInt(dateText.substring(4, 6)) - 1, dateText.substring(6, 8),
                    dateText.substring(9, 11), dateText.substring(11, 13), dateText.substring(13, 15)));
                const diffKST = 9 * 60 * 60 * 1000;
                const dateKST = new Date(dateUTC.getTime() + diffKST);

                const duration = log.battle.duration != null ? log.battle.duration : 0;
                const mapID = log.event.id;
                const typeName = log.battle.type;

                if (typeNameArray.includes(typeName) && mapID !== 0) {
                    const typeIndex = typeNameArray.indexOf(typeName);
                    const trophyChange = (log.battle.trophyChange !== undefined) ?
                        log.battle.trophyChange : 0;
                    const currentPlayers = JSON.stringify(log.battle.teams);

                    for (const team in log.battle.teams) {
                        const battleFlatten = log.battle.teams.flat(1);
                        const trophyGrade = () => {
                            if ([0, 4, 5].includes(typeIndex)) {
                                return Math.max(...battleFlatten.map(item => item.brawler.trophies)) >= 1000 ? 4 :
                                    Math.max(...battleFlatten.map(item => item.brawler.trophies)) >= 750 ? 3 :
                                        Math.max(...battleFlatten.map(item => item.brawler.trophies)) >= 500 ? 2 :
                                            Math.max(...battleFlatten.map(item => item.brawler.trophies)) >= 250 ? 1 : 0;
                            } else {
                                return Math.max(...battleFlatten.map(item => item.brawler.trophies));
                            }
                        }

                        for (const player of log.battle.teams[team]) {
                            const isStarPlayer = log.battle.starPlayer != null ? log.battle.starPlayer.tag === player.tag ? 1 : 0 : 0;

                            const rank = setRank(log.battle.mode, team);
                            const result = await setResult(log.battle.mode, JSON.stringify(log.battle.teams[team]), rank, member, log.battle.result);
                            const type = await setType(typeIndex, trophyChange, trophyGrade, currentPlayers, log.battle.mode);

                            await BattleLog.findOrCreate({
                                where: {
                                    id: `${dateText}_${member}_${player.tag}`,
                                },
                                defaults: {
                                    member_id: member,
                                    date: dateKST,
                                    duration: duration,
                                    map_id: mapID,
                                    game_type: type,
                                    rank: rank,
                                    game_result: result,
                                    trophy_grade: trophyGrade(),
                                    trophy_change: trophyChange,
                                    is_star_player: isStarPlayer,
                                    player_team: team,
                                    player_tag: player.tag,
                                    player_name: player.name,
                                    player_brawler_id: player.brawler.id,
                                    player_brawler_power: player.brawler.power,
                                    player_brawler_trophy: player.brawler.trophies
                                }
                            });
                        }
                    }
                }
            }
        }
    }
}