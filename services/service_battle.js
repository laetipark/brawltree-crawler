import fs from "fs";
import fetch from "node-fetch";
import config from "../config/config.js";

import {col, fn, Op} from "sequelize";
import Battle from "../models/table_battle.js";
import Member from "../models/table_member.js";
import InfoMap from "../models/view_info_map.js";
import Rotation from "../models/view_rotation.js";

const typeNameArray = ["ranked", "friendly", "soloRanked", "teamRanked", "challenge", "championshipChallenge"];
const resultNameArray = ["victory", "draw", "defeat"];

export class battleService {

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

        const responseBattleLog = await fetch(`${config.url}/players/${member.replace("#", "%23")}/battlelog`, {
            method: "GET",
            headers: config.headers,
        })
            .then(res => res.json())
            .catch(err => console.error(err));

        for (const item of responseBattleLog?.items) {
            if (item.event.id !== 0 && item.battle.type !== undefined && item.battle.type !== "friendly") {
                const dateRaw = item.battleTime;
                const matchDate = new Date(
                    Date.UTC(parseInt(dateRaw.substring(0, 4)),
                        parseInt(dateRaw.substring(4, 6)) - 1,
                        parseInt(dateRaw.substring(6, 8)),
                        parseInt(dateRaw.substring(9, 11)),
                        parseInt(dateRaw.substring(11, 13)),
                        parseInt(dateRaw.substring(13, 15))));
                const duration = item.battle.duration != null ? item.battle.duration : 0;

                const mapID = item.event.id;

                const teams = item.battle.teams !== undefined ?
                    item.battle.teams :
                    item.battle.players;
                const mapModeNumber = config.modeClass.tripleModes.includes(item.event.mode) ? 3 :
                    config.modeClass.duoModes.includes(item.event.mode) ? 2 :
                        config.modeClass.soloModes.survive.includes(item.event.mode) ? 1 : 0;
                const matchChange = item.battle.trophyChange !== undefined ? item.battle.trophyChange : 0;

                const currentPlayers = JSON.stringify(teams);
                const typeIndex = typeNameArray.indexOf(item.battle.type);

                const maxTrophies = Math.max(...teams.map(team => {
                    if ([3, 2].includes(mapModeNumber)) {
                        return Math.max(...team.map(player => {
                            return player.brawler.trophies;
                        }));
                    } else if (mapModeNumber === 0) {
                        return Math.max(...team.brawlers.map(brawler => {
                            return brawler.trophies;
                        }));
                    } else {
                        return team.brawler.trophies;
                    }
                }));
                const matchType = await setType(typeIndex, matchChange, maxTrophies, currentPlayers, mapModeNumber);
                const matchGrade = [2, 3, 6].includes(matchType) ? maxTrophies :
                    [5].includes(matchType) ? Math.floor(maxTrophies / 100) :
                        (maxTrophies >= 1000 ? 4 : maxTrophies >= 750 ? 3 :
                            maxTrophies >= 500 ? 2 : maxTrophies >= 250 ? 1 : 0);

                for (let teamNumber in teams) {
                    const players = [2, 3].includes(mapModeNumber) ? teams[teamNumber] : teams;
                    for (const playerNumber in players) {
                        const matchRank = mapModeNumber === 1 ? playerNumber : mapModeNumber === 2 ? teamNumber : -1;
                        const matchResult = players[playerNumber] === member && [0, 3].includes(mapModeNumber) ?
                            await setResult(teams.length, playerNumber, (resultNameArray.indexOf(item.battle.result) - 1) * -1) :
                            await setResult(teams.length, matchRank, resultNameArray.indexOf(item.battle.result) - 1);

                        const isStarPlayer = item.battle.starPlayer !== null ?
                            item.battle.starPlayer !== undefined ?
                                players[playerNumber].tag === item.battle.starPlayer.tag : 0 : 0;

                        if (mapModeNumber === 0) {
                            for (const brawler of players[playerNumber]?.brawlers) {
                                await Battle.findOrCreate({
                                    where: {
                                        MEMBER_ID: member,
                                        PLAYER_ID: players[playerNumber].tag,
                                        BRAWLER_ID: brawler.id,
                                        MATCH_DT: matchDate
                                    },
                                    defaults: {
                                        MAP_ID: mapID,
                                        MAP_MD_CD: mapModeNumber,
                                        MATCH_TYP: matchType,
                                        MATCH_GRD: matchGrade,
                                        MATCH_DUR: duration,
                                        MATCH_RNK: matchRank,
                                        MATCH_RES: matchResult,
                                        MATCH_CHG: matchChange,
                                        PLAYER_NM: players[playerNumber].name,
                                        PLAYER_TM_NO: teamNumber,
                                        PLAYER_SP_BOOL: isStarPlayer,
                                        BRAWLER_PWR: brawler.power,
                                        BRAWLER_TRP: brawler.trophies,
                                        RAW_TYP: typeIndex,
                                        RAW_CHG: brawler.trophyChange
                                    }
                                });
                            }
                        } else {
                            await Battle.findOrCreate({
                                where: {
                                    MEMBER_ID: member,
                                    PLAYER_ID: players[playerNumber].tag,
                                    BRAWLER_ID: players[playerNumber].brawler.id,
                                    MATCH_DT: matchDate
                                },
                                defaults: {
                                    MAP_ID: mapID,
                                    MAP_MD_CD: mapModeNumber,
                                    MATCH_TYP: matchType,
                                    MATCH_GRD: matchGrade,
                                    MATCH_DUR: duration,
                                    MATCH_RNK: matchRank,
                                    MATCH_RES: matchResult,
                                    MATCH_CHG: matchChange,
                                    PLAYER_NM: players[playerNumber].name,
                                    PLAYER_TM_NO: [1, 2].includes(mapModeNumber) ? matchRank : teamNumber,
                                    PLAYER_SP_BOOL: isStarPlayer,
                                    BRAWLER_PWR: players[playerNumber].brawler.power,
                                    BRAWLER_TRP: players[playerNumber].brawler.trophies,
                                    RAW_TYP: typeIndex,
                                    RAW_CHG: 0
                                }
                            });

                            if (matchType === 6) {
                                await Battle.update({
                                    MATCH_TYP: matchType
                                }, {
                                    where: {
                                        MEMBER_ID: member,
                                        PLAYER_ID: players[playerNumber].tag,
                                        BRAWLER_ID: players[playerNumber].brawler.id,
                                        MATCH_DT: matchDate,
                                    },
                                });
                            }
                        }
                    }
                }
            }
        }
    };

    /** 이전 시즌 전투 기록 백업 */
    static backupBattles = async (season) => {
        await Battle.findAll({
            where: {
                MATCH_DT: {
                    [Op.lt]: season.SEASON_END_DT
                }
            },
            raw: true
        }).then(async (result) => {
            fs.writeFileSync(`./backup/battle-${Date.now()}.json`, JSON.stringify(result));
            await Battle.destroy({
                where: {
                    MATCH_DT: {
                        [Op.lt]: season.SEASON_END_DT
                    }
                }
            });
        });
    };

    /** 전투 기록의 멤버 이름 통일시켜 변경
     * @param member 멤버 ID
     */
    static updatePlayerName = async member => {
        const memberName = await Member.findOne({
            attributes: ["MEMBER_NM"],
            where: {
                MEMBER_ID: member
            }
        });

        await Battle.update({
            PLAYER_NM: memberName.MEMBER_NM
        }, {
            where: {
                PLAYER_ID: member,
            },
        });
    };

    /** 하루 멤버들의 전투 정보 요약 반환
     * @param beginDate 하루 시작
     * @param endDate 하루 끝
     * @param type 게임 타입
     * @param mode 게임 모드
     */
    static selectBattlesSummary = async (beginDate, endDate, type, mode) => {
        return await Battle.findAll({
            include: [
                {
                    model: Member,
                    required: true,
                    attributes: []
                },
                {
                    model: InfoMap,
                    required: true,
                    attributes: [],
                    where: {
                        MAP_MD: {
                            [Op.in]: mode !== "all" ? [mode] : config.modeList
                        },
                    }
                },
            ],
            attributes: [
                "MEMBER_ID",
                [fn("COUNT", fn("DISTINCT", col("MATCH_DT"))), "MATCH_CNT"],
                [fn("SUM", col("MATCH_CHG")), "MATCH_CHG"],
                [col("Member.MEMBER_NM"), "MEMBER_NM"]
            ],
            group: ["MEMBER_ID"],
            where: {
                MEMBER_ID: [col("PLAYER_ID")],
                MATCH_DT: {
                    [Op.between]: [beginDate, endDate]
                },
                MATCH_TYP: {
                    [Op.in]: type !== "7" ? [type] : config.typeList
                },
            },
            order: [
                ["MATCH_CNT", "DESC"]
            ],
            raw: true
        });
    };

    /** 진행 중인 트로피 리그 게임 모드 반환 */
    static selectMapModeTL = async () =>
        await Rotation.findAll({
            include: [
                {
                    model: InfoMap,
                    required: true,
                    attributes: []
                }
            ],
            attributes: [
                [col("InfoMap.MAP_MD"), "MAP_MD"]],
            where: {
                ROTATION_SLT_NO: {
                    [Op.in]: [1, 2, 3, 4, 5, 6, 33]
                }
            },
            group: ["MAP_MD"],
            raw: true,
        }).then(result => {
            const filterMode = result.map(mode => mode.MAP_MD);
            const filterModeList = config.modeList.filter(mode => filterMode.includes(mode));
            filterModeList.unshift("all");
            return filterModeList;
        });

    /** 진행 중인 파워 리그 게임 모드 반환 */
    static selectMapModePL = async () => await InfoMap.findAll({
        attributes: ["MAP_MD"],
        where: {
            ROTATION_PL_BOOL: true
        },
        group: ["MAP_MD"]
    }).then(result => {
        const filterMode = result.map(mode => mode.MAP_MD);
        const filterModeList = config.modeList.filter(mode => filterMode.includes(mode));
        filterModeList.unshift("all");
        return filterModeList;
    });

    /** 하루 멤버의 세부 전투 정보 불러오기
     * @param id 멤버 ID
     * @param beginDate 하루 시작
     * @param endDate 하루 끝
     */
    static selectBattlesDetail = async (id, beginDate, endDate) => {
        const member = await Member.findOne({
            attributes: ["MEMBER_ID", "MEMBER_NM", "MEMBER_PROFILE",
                "TROPHY_CUR", "PL_SL_CUR", "PL_TM_CUR"],
            where: {
                MEMBER_ID: `#${id}`,
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
            attributes:
                ["MEMBER_ID", [fn("JSON_OBJECT", "MATCH_DT", col("MATCH_DT"), "MATCH_DUR", col("MATCH_DUR"),
                    "MAP_ID", col("Battle.MAP_ID"), "MAP_MD", col("InfoMap.MAP_MD"), "MAP_NM", col("InfoMap.MAP_NM"),
                    "RAW_TYP", col("RAW_TYP"), "MATCH_TYP", col("MATCH_TYP"), "MAP_MD_CD", col("MAP_MD_CD"),
                    "MATCH_GRD", col("MATCH_GRD"), "MATCH_CHG", col("MATCH_CHG")), "BATTLE_INFO"],
                    [fn("JSON_ARRAYAGG", fn("JSON_OBJECT",
                        "PLAYER_ID", col("PLAYER_ID"), "PLAYER_NM", col("PLAYER_NM"), "PLAYER_TM_NO", col("PLAYER_TM_NO"),
                        "BRAWLER_ID", col("BRAWLER_ID"), "BRAWLER_PWR", col("BRAWLER_PWR"), "BRAWLER_TRP", col("BRAWLER_TRP"),
                        "MATCH_RNK", col("MATCH_RNK"), "MATCH_RES", col("MATCH_RES"), "MATCH_CHG", col("MATCH_CHG"))), "BATTLE_PLAYERS"]],
            group: ["MEMBER_ID", "MATCH_DT",
                "MATCH_DUR", "Battle.MAP_ID", "MATCH_TYP",
                "MAP_MD_CD", "MATCH_GRD", "MATCH_CHG", "RAW_TYP"],
            where: {
                MATCH_DT: {
                    [Op.between]: [beginDate, endDate]
                },
                MEMBER_ID: `#${id}`
            },
            order: [["MATCH_DT", "DESC"]]
        });

        return [member, battles];
    };
}