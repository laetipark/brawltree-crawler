import fs from "fs";
import fetch from "node-fetch";
import config from "../config/config.js";
import modeJSON from "../public/json/mode.json" assert {type: "json"};

import Battle from "../models/battle.js";
import Map from "../models/map.js";
import Member from "../models/member.js";
import {col, fn, Op} from "sequelize";
import Season from "../models/season.js";

const typeNameArray = ['ranked', 'friendly', 'soloRanked', 'teamRanked', 'challenge', 'championshipChallenge'];
const resultNameArray = ['victory', 'draw', 'defeat'];

export class battleService {

    /** 신규 전투 맵 데이터베이스에 추가
     * @param event 이벤트 정보
     */
    static insertMaps = async (event) => {
        await Map.findOrCreate({
            where: {
                id: event.id
            },
            defaults: {
                mode: event.mode,
                name: event.map
            }
        });
    };

    /** 최신 25개 전투 정보 확인 및 데이터베이스에 추가
     * @param member 멤버 태그
     */
    static insertBattles = async (member) => {
        const comparePlayers = {
            isClubLeague: false,
            teams: ""
        };

        // 게임 타입을 클럽 리그와 일반 게임 & 파워 리그 구분
        const setType = async (typeNumber, trophyChange, maxTrophies, currentPlayers, matchMode) => {
            if (typeNumber === 3 && [3, 5, 7, 9].includes(trophyChange)) {
                comparePlayers.teams = currentPlayers;
                return 6;
            } else if (typeNumber === 0 && [1, 2, 3, 4].includes(trophyChange) && maxTrophies < 20 && matchMode === 3) {
                return 6;
            } else if (typeNumber === 3 && comparePlayers.teams === currentPlayers && maxTrophies < 20) {
                return 6;
            } else {
                comparePlayers.teams = "";
                return typeNumber;
            }
        };

        // 전투 결과 수치형으로 변환
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

        const responseBattleLog = await fetch(`${config.url}/players/${member.replace('#', '%23')}/battlelog`, {
            method: 'GET',
            headers: config.headers,
        })
            .then(res => res.json())
            .catch(err => console.error(err));

        for (const item of responseBattleLog.items) {
            if (item.event.id !== 0 && item.battle.type !== undefined && item.battle.type !== 'friendly') {
                const dateRaw = item.battleTime;
                const matchDate = new Date(
                    Date.UTC(parseInt(dateRaw.substring(0, 4)),
                        parseInt(dateRaw.substring(4, 6)) - 1,
                        parseInt(dateRaw.substring(6, 8)),
                        parseInt(dateRaw.substring(9, 11)),
                        parseInt(dateRaw.substring(11, 13)),
                        parseInt(dateRaw.substring(13, 15))));
                const duration = item.battle.duration != null ? item.battle.duration : 0;

                await this.insertMaps(item.event);
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
                        const matchRank = matchMode === 1 ? playerNumber : matchMode === 2 ? teamNumber : -1;
                        const matchResult = players[playerNumber] === member && [0, 3].includes(matchMode) ?
                            await setResult(teams.length, playerNumber, (resultNameArray.indexOf(item.battle.result) - 1) * -1) :
                            await setResult(teams.length, matchRank, resultNameArray.indexOf(item.battle.result) - 1);

                        const isStarPlayer = item.battle.starPlayer !== null ?
                            item.battle.starPlayer !== undefined ?
                                players[playerNumber].tag === item.battle.starPlayer.tag : 0 : 0;

                        if (matchMode === 0) {
                            for (const brawler of players[playerNumber]?.brawlers) {
                                await Battle.findOrCreate({
                                    where: {
                                        member_id: member,
                                        player_id: players[playerNumber].tag,
                                        brawler_id: brawler.id,
                                        match_date: matchDate
                                    },
                                    defaults: {
                                        map_id: mapID,
                                        match_type: matchType,
                                        match_mode: matchMode,
                                        match_duration: duration,
                                        match_rank: matchRank,
                                        match_result: matchResult,
                                        match_grade: matchGrade,
                                        match_change: trophyChange,
                                        player_name: players[playerNumber].name,
                                        player_team: teamNumber,
                                        player_star_player: isStarPlayer,
                                        brawler_power: brawler.power,
                                        brawler_trophy: brawler.trophies,
                                        raw_type: typeIndex,
                                        raw_change: brawler.trophyChange
                                    }
                                });
                            }
                        } else {
                            await Battle.findOrCreate({
                                where: {
                                    member_id: member,
                                    player_id: players[playerNumber].tag,
                                    brawler_id: players[playerNumber].brawler.id,
                                    match_date: matchDate
                                },
                                defaults: {
                                    map_id: mapID,
                                    match_type: matchType,
                                    match_mode: matchMode,
                                    match_duration: duration,
                                    match_rank: matchRank,
                                    match_result: matchResult,
                                    match_grade: matchGrade,
                                    match_change: trophyChange,
                                    player_name: players[playerNumber].name,
                                    player_team: teamNumber,
                                    player_star_player: isStarPlayer,
                                    brawler_power: players[playerNumber].brawler.power,
                                    brawler_trophy: players[playerNumber].brawler.trophies,
                                    raw_type: typeIndex,
                                    raw_change: 0
                                }
                            });

                            if (matchType === 6) {
                                await Battle.update({
                                    match_type: matchType
                                }, {
                                    where: {
                                        member_id: member,
                                        player_id: players[playerNumber].tag,
                                        brawler_id: players[playerNumber].brawler.id,
                                        match_date: matchDate,
                                    },
                                });
                            }
                        }
                    }
                }
            }
        }
    }

    /** 하루 멤버들의 전투 정보 요약 불러오기
     * @param beginDate 하루 시작
     * @param endDate 하루 끝
     * @param type 게임 타입
     * @param mode 게임 모드
     */
    static selectBattlesSummary = async (beginDate, endDate, type, mode) => {
        const matchType = config.typeList.filter.includes(type) ? config.typeList[`${type}`] : config.typeList.all;
        const matchMode = config.modeList.includes(mode) ? Array(mode) : config.modeList;

        const battles = await Battle.findAll({
            include: [
                {
                    model: Member,
                    required: true,
                    attributes: ['name']
                },
                {
                    model: Map,
                    required: true,
                    attributes: [],
                    where: {
                        mode: {
                            [Op.in]: matchMode
                        }
                    }
                },
            ],
            attributes: [
                "member_id",
                [fn("COUNT", fn("DISTINCT", col("match_date"))), "match_count"],
                [fn("SUM", col('match_change')), "match_change"]
            ],
            group: ["member_id"],
            where: {
                member_id: [col('Battle.player_id')],
                match_date: {
                    [Op.between]: [beginDate, endDate]
                },
                match_type: {
                    [Op.in]: matchType
                },
            },
            order: [
                ['match_count', 'DESC']
            ],
            raw: true,
        });

        const season = await Season.findOne({
            order: [['begin_date', 'DESC']],
        });

        return [battles, season];
    };

    /** 하루 멤버의 세부 전투 정보 불러오기
     * @param id 멤버 ID
     * @param beginDate 하루 시작
     * @param endDate 하루 끝
     */
    static selectBattlesDetail = async (id, beginDate, endDate) => {
        const member = await Member.findOne({
            attributes: ['id', 'name', 'trophy_current', 'league_solo_current', 'league_team_current', 'profile_picture'],
            where: {
                id: `#${id}`,
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
            attributes:
                ["member_id", [fn('JSON_OBJECT', "id", col('match_date'),
                    "match_duration", col('match_duration'), "map_name", col('Map.name'), "map_mode", col('Map.mode'),
                    "raw_type", col('raw_type'), "match_type", col('match_type'), "match_mode", col('match_mode'),
                    "match_grade", col('match_grade'), "match_change", col('match_change')), 'info'],
                    [fn('JSON_ARRAYAGG', fn('JSON_OBJECT',
                        "player_id", col('player_id'), "player_name", col('player_name'),
                        "player_team", col('player_team'), "brawler_id", col('brawler_id'),
                        "brawler_power", col("brawler_power"), "brawler_trophy", col('brawler_trophy'),
                        "match_rank", col('match_rank'), "match_result", col('match_result'), "raw_change", col('raw_change'))), 'players']],
            group: ['member_id', 'match_date',
                'match_duration', 'map_id', 'match_type',
                'match_mode', 'match_grade', 'match_change', 'raw_type'],
            where: {
                match_date: {
                    [Op.between]: [beginDate, endDate]
                },
                member_id: `#${id}`
            },
            order: [['match_date', 'DESC']],
            raw: true
        });

        const season = await Season.findOne({
            order: [['begin_date', 'DESC']],
        });

        return [member, battles, season];
    };

    static backupBattles = async () => {
        const season = await Season.findAll({
            limit: 3,
            order: [['begin_date', 'DESC']],
        }).then(result => {
            return result[2].end_date;
        });

        await Battle.findAll({
            where: {
                match_date: {
                    [Op.lt]: season
                }
            },
            raw: true
        }).then(async (result) => {
            fs.writeFileSync(`./backup/battle-${Date.now()}.json`, JSON.stringify(result));
            await Battle.destroy({
                where: {
                    match_date: {
                        [Op.lt]: season
                    }
                }
            });
        });
    }
}