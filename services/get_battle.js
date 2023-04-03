import fetch from 'node-fetch';
import Battle from '../models/battle.js';
import Rotation from '../models/rotation.js';
import config from '../config/config.js';
import modeJSON from "../public/json/mode.json" assert {type: "json"};

const url = `https://api.brawlstars.com/v1`;

const typeNameArray = ['ranked', 'friendly', 'soloRanked', 'teamRanked', 'challenge', 'championshipChallenge'];
const resultNameArray = ['victory', 'draw', 'defeat'];

export default async (members) => {
    console.log('🌸 GET START : BATTLE');

    const comparePlayers = {
        isClubLeague: false,
        teams: ""
    };

    /** addMaps : 신규 전투 맵 정보 추가 */
    const addMaps = async (event) => {
        await Rotation.findOrCreate({
            where: {
                id: event.id
            },
            defaults: {
                mode: event.mode,
                name: event.map
            }
        });
    };


    const setType = async (typeIndex, trophyChange, maxTrophies, currentPlayers, matchMode) => {
        if (typeIndex === 3 && [3, 5, 7, 9].includes(trophyChange)) {
            comparePlayers.teams = currentPlayers;
            return 6;
        } else if (typeIndex === 0 && [1, 2, 3, 4].includes(trophyChange) && maxTrophies < 20 && matchMode === 3) {
            return 6;
        } else if (typeIndex === 3 && comparePlayers.teams === currentPlayers && maxTrophies < 20) {
            return 6;
        } else {
            comparePlayers.teams = "";
            return typeIndex;
        }
    };

    /** setResult : 모드별 전투 결과 설정 */
    const setResult = (teams, rank, result) => {
        if (teams > 2) {
            const rankDivide = rank / (2 / (10 / teams));
            if (rankDivide < 2) {
                return -1;
            } else if (rankDivide < 3) {
                return 0;
            } else {
                return 1;
            }
        } else {
            return result;
        }
    };

    const insertBattle = async (dateRaw, memberID, dateKST, duration, mapID,
                                matchType, teamsNumber, matchRank, matchResult, matchGrade, trophyChange,
                                playerTag, playerName, teamNumber, isStarPlayer,
                                brawlerID, brawlerPower, trophies, rawType, rawChange) => {
        await Battle.findOrCreate({
            where: {
                member_id: memberID,
                player_id: playerTag,
                brawler_id: brawlerID,
                match_date: dateKST
            },
            defaults: {
                map_id: mapID,
                match_type: matchType,
                match_mode: teamsNumber,
                match_duration: duration,
                match_rank: matchRank,
                match_result: matchResult,
                match_grade: matchGrade,
                match_change: trophyChange,
                player_name: playerName,
                player_team: teamNumber,
                player_star_player: isStarPlayer,
                brawler_power: brawlerPower,
                brawler_trophy: trophies,
                raw_type: rawType,
                raw_change: rawChange
            }
        });

        if (matchType === 6) {
            await Battle.update({
                match_type: matchType
            }, {
                where: {
                    member_id: memberID,
                    player_id: playerTag,
                    brawler_id: brawlerID,
                    match_date: dateKST,
                },
            });
        }
    }

    for (const member of members) {
        const memberTag = member.replace('#', '%23');
        const responseBattleLog = await fetch(`${url}/players/${memberTag}/battlelog`, {
            method: 'GET',
            headers: config.headers,
        })
            .then(res => res.json())
            .catch(err => console.error(err));

        if (responseBattleLog.items !== undefined) {
            for (const item of responseBattleLog.items) {
                if (item.event.id !== 0 && item.battle.type !== undefined && item.battle.type !== 'friendly') {
                    const dateRaw = item.battleTime;
                    const dateUTC = new Date(
                        Date.UTC(parseInt(dateRaw.substring(0, 4)),
                            parseInt(dateRaw.substring(4, 6)) - 1,
                            parseInt(dateRaw.substring(6, 8)),
                            parseInt(dateRaw.substring(9, 11)),
                            parseInt(dateRaw.substring(11, 13)),
                            parseInt(dateRaw.substring(13, 15))));
                    const diffKST = 9 * 60 * 60 * 1000;

                    const dateKST = new Date(dateUTC.getTime() + diffKST);
                    const duration = item.battle.duration != null ? item.battle.duration : 0;

                    await addMaps(item.event);
                    const mapID = item.event.id;

                    const teams = item.battle.teams !== undefined ?
                        item.battle.teams :
                        item.battle.players;
                    const matchMode = modeJSON.tripleModes.includes(item.event.mode) ? 3 :
                        modeJSON.duoModes.includes(item.event.mode) ? 2 :
                            modeJSON.soloModes.survive.includes(item.event.mode) ? 1 : 0;
                    const trophyChange = item.battle.trophyChange !== undefined ? item.battle.trophyChange : 0;

                    const currentPlayers = JSON.stringify(teams);
                    const typeIndex = typeNameArray.indexOf(item.battle.type);

                    const maxTrophies = Math.max(...teams.map(team => {
                        if ([3, 2].includes(matchMode)) {
                            return Math.max(...team.map(player => {
                                return player.brawler.trophies;
                            }));
                        } else if (matchMode === 0) {
                            return Math.max(...team.brawlers.map(brawler => {
                                return brawler.trophies;
                            }));
                        } else {
                            return team.brawler.trophies;
                        }
                    }));
                    const matchType = await setType(typeIndex, trophyChange, maxTrophies, currentPlayers, matchMode);
                    const matchGrade = [2, 3, 6].includes(matchType) ? maxTrophies :
                        [5].includes(matchType) ? Math.floor(maxTrophies / 100) :
                            (maxTrophies >= 1000 ? 4 : maxTrophies >= 750 ? 3 :
                                maxTrophies >= 500 ? 2 : maxTrophies >= 250 ? 1 : 0);

                    for (let teamNumber in teams) {
                        const players = [2, 3].includes(matchMode) ? teams[teamNumber] : teams;
                        for (const playerNumber in players) {
                            const matchRank = [1, 2].includes(matchMode) ? playerNumber : -1;
                            const matchResult = players[playerNumber] === member && [0, 3].includes(matchMode) ?
                                await setResult(teams.length, playerNumber, (resultNameArray.indexOf(item.battle.result) - 1) * -1) :
                                await setResult(teams.length, playerNumber, resultNameArray.indexOf(item.battle.result) - 1);

                            const isStarPlayer = item.battle.starPlayer !== null ?
                                item.battle.starPlayer !== undefined ?
                                    players[playerNumber].tag === item.battle.starPlayer.tag : 0 : 0;

                            if (matchMode === 0) {
                                for (const brawlers of players[playerNumber].brawlers) {
                                    await insertBattle(dateRaw, member, dateKST, duration, mapID,
                                        matchType, matchMode, matchRank, matchResult, matchGrade, 0,
                                        players[playerNumber].tag, players[playerNumber].name, playerNumber, isStarPlayer,
                                        brawlers.id, brawlers.power, brawlers.trophies, typeIndex, brawlers.trophyChange);
                                }
                            } else {
                                await insertBattle(dateRaw, member, dateKST, duration, mapID,
                                    matchType, matchMode, matchRank, matchResult, matchGrade, trophyChange,
                                    players[playerNumber].tag, players[playerNumber].name,
                                    [2, 3].includes(matchMode) ? teamNumber : matchRank, isStarPlayer,
                                    players[playerNumber].brawler.id, players[playerNumber].brawler.power, players[playerNumber].brawler.trophies,
                                    typeIndex, 0);
                            }
                        }
                    }
                }
            }
        } else {
            console.log(`⚠️ UNDEFINED MEMBER BATTLE LOG : ${member}`);
        }
    }
}