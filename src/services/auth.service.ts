import axios from 'axios';
import { Repository } from 'typeorm';

import DateService from './date.service';
import SeasonService from './season.service';

import { UserBattles, UserProfile, Users } from '~/entities/users.entity';
import {
  UserBrawlerBattles,
  UserBrawlerItems,
  UserBrawlers,
} from '~/entities/user-brawlers.entity';

import UserRequest from '../interfaces/types/userRequest';

import config from '~/configs/config';

const typeNameArray = [
  'ranked',
  'friendly',
  'soloRanked',
  'teamRanked',
  'challenge',
  'championshipChallenge',
];
const resultNameArray = ['victory', 'draw', 'defeat'];

export default class AuthService {
  userRequests: UserRequest[];
  pendingRequests: UserRequest[];
  private readonly maxRequests: number;

  constructor(
    private users: Repository<Users>,
    private userProfile: Repository<UserProfile>,
    private userBattles: Repository<UserBattles>,
    private userBrawlers: Repository<UserBrawlers>,
    private userBrawlerBattles: Repository<UserBrawlerBattles>,
    private userBrawlerItems: Repository<UserBrawlerItems>,
    private seasonService: SeasonService,
    private dateService: DateService,
  ) {
    this.userRequests = [];
    this.pendingRequests = [];
    this.maxRequests = 4;
  }

  /** Get UserProfile JSON
   * @param userID User ID */
  async getUserProfile(userID: string) {
    return await axios({
      url: `${config.url}/players/%23${userID}`,
      method: 'GET',
      headers: config.headers,
    })
      .then((res) => {
        return res.data;
      })
      .catch((err) => console.error(err.response?.data));
  }

  /** Manage User Requests
   * @param userID User ID
   * @param cycle cycle status */
  async manageUserRequests(userID: string, cycle: boolean) {
    /** @type UserRequest 요청 정보 */
    const requestInfo: UserRequest = { userID, cycle };

    /** 최대 동시 실행 요청 수를 초과한 경우 대기열에 추가, 미만이면 바로 실행 */
    if (this.userRequests.length >= this.maxRequests) {
      this.pendingRequests.push(requestInfo);
    } else {
      this.userRequests.push(requestInfo);
      await this.fetchBattleRequest(requestInfo);
    }
  }

  /** Manage User Requests
   * @param userID User ID
   * @param cycle cycle status */
  async fetchBattleRequest({ userID, cycle }: UserRequest) {
    try {
      await axios({
        url: `${config.url}/players/%23${userID}/battlelog`,
        method: 'GET',
        headers: config.headers,
      }).then(async (res) => {
        /** Player Battle Logs */
        const battleLogs = res.data;
        /** Insert User Battle Logs */
        await this.insertUserBattles(battleLogs, userID);

        /** @type Date Get Recent Battle Time */
        const newUserLastBattle: Date = this.dateService.getDate(
          battleLogs?.items[0].battleTime,
        );

        /** Update User Recent Battle Time */
        await this.users
          .createQueryBuilder()
          .update()
          .set({
            lastBattleAt: newUserLastBattle,
          })
          .where('userID = :id', {
            id: `#${userID}`,
          })
          .execute();

        /** Update User's Brawler Battles */
        await this.updateUserBrawlerBattles(userID);

        /** 20분 후에 manageUserRequests 실행 */
        if (cycle) {
          setTimeout(
            () => {
              this.manageUserRequests(userID, cycle);
            },
            20 * 60 * 1000,
          );
        }
      });
    } catch (err) {
      console.error(err.response?.data);
      const errorTime = err.response?.status === 404 ? 50 : 0;

      /** 10(60)분 후에 manageUserRequests 실행 */
      setTimeout(
        () => {
          this.manageUserRequests(userID, cycle);
        },
        (10 + errorTime) * 60 * 1000,
      );
    } finally {
      /** @type number 현재 요청 index
       * 요청이 완료되면 현재 요청을 지우고 다음 요청을 확인하고 실행 */
      const index: number = this.userRequests.findIndex(
        (item) => item.userID === userID,
      );

      if (index !== -1) {
        this.userRequests.splice(index, 1);
      }

      setTimeout(
        async () => {
          const nextRequest = this.pendingRequests.shift();
          if (nextRequest) {
            const { userID, cycle } = nextRequest;
            await this.manageUserRequests(userID, cycle);
          }
        },
        Math.floor(Math.random() * 10001) + 60000,
      );
    }
  }

  /** Update User's Brawler Battles
   * @param userID User ID */
  async updateUserBrawlerBattles(userID: string) {
    const battles = await this.userBattles
      .createQueryBuilder('ub')
      .select('ub.brawlerID', 'brawlerID')
      .addSelect('ub.mapID', 'mapID')
      .addSelect('ub.matchType', 'matchType')
      .addSelect('ub.matchGrade', 'matchGrade')
      .addSelect('COUNT(*)', 'matchCount')
      .addSelect(
        'COUNT(CASE WHEN ub.matchResult = -1 THEN 1 END)',
        'victoryCount',
      )
      .addSelect(
        'COUNT(CASE WHEN ub.matchResult = 1 THEN 1 END)',
        'defeatCount',
      )
      .where('ub.userID = :id AND ub.playerID = :id', {
        id: `#${userID}`,
      })
      .andWhere('ub.matchType IN (0, 2, 3)')
      .groupBy('ub.brawlerID')
      .addGroupBy('ub.mapID')
      .addGroupBy('ub.matchType')
      .addGroupBy('ub.matchGrade')
      .getRawMany()
      .then((result) => {
        return result.map((battle) => {
          return {
            userID: `#${userID}`,
            brawlerID: battle.brawlerID,
            mapID: battle.mapID,
            matchType: battle.matchType,
            matchGrade: battle.matchGrade,
            matchCount: battle.matchCount,
            victoryCount: battle.victoryCount,
            defeatCount: battle.defeatCount,
          };
        });
      });

    await this.userBrawlerBattles.save(battles);
  }

  /** 멤버 기록과 소유 브롤러 정보 데이터베이스에 추가
   * @param user 멤버 json
   */
  async updateUserProfile(user) {
    const season = await this.seasonService.selectRecentSeason();

    const getRankPL = async (typeNum: number, tag: string, column) => {
      return await this.userBattles
        .createQueryBuilder('ub')
        .select('ub.brawlerTrophies', 'brawlerTrophies')
        .where('ub.userID = :id AND ub.playerID = :id', {
          id: tag,
        })
        .andWhere('ub.matchType = :type', {
          type: typeNum,
        })
        .orderBy(`ub.${column}`, 'DESC')
        .getRawOne()
        .then((result) => {
          return result != null ? result.brawlerTrophies - 1 : 0;
        });
    };

    const getTrophyBegin = async (tag, brawlerID, current) => {
      return await this.userBattles
        .createQueryBuilder('ub')
        .select('ub.brawlerTrophies', 'brawlerTrophies')
        .where('ub.userID = :id AND ub.playerID = :id', {
          id: tag,
        })
        .andWhere('ub.brawlerID = :brawlerID', {
          brawlerID: brawlerID,
        })
        .andWhere('ub.matchDate > :date', {
          date: season.beginDate,
        })
        .andWhere('ub.matchType = 0')
        .orderBy(`ub.matchDate`, 'ASC')
        .getRawOne()
        .then((result) => {
          return result != null ? result.brawlerTrophies : current;
        });
    };

    if (user.tag !== undefined) {
      const [
        soloRankCurrent,
        teamRankCurrent,
        soloRankHighest,
        teamRankHighest,
      ] = await Promise.all([
        getRankPL(2, user.tag, 'matchDate'),
        getRankPL(3, user.tag, 'matchDate'),
        getRankPL(2, user.tag, 'brawlerTrophies'),
        getRankPL(3, user.tag, 'brawlerTrophies'),
      ]);

      const brawlers = [];
      const brawlerItems = [];
      const brawlerItemIDs = [];

      user.brawlers.map(async (brawler) => {
        const brawlerID = brawler.id;
        const brawlerPower = brawler.power;
        const trophyBegin = await getTrophyBegin(
          user.tag,
          brawlerID,
          brawler.trophies,
        );

        brawlers.push({
          userID: user.tag,
          brawlerID: brawlerID,
          brawlerPower: brawlerPower,
          beginTrophies: trophyBegin,
          currentTrophies: brawler.trophies,
          highestTrophies: brawler.highestTrophies,
          brawlerRank: brawler.rank,
        });

        const gears = brawler.gears;
        const starPowers = brawler.starPowers;
        const gadgets = brawler.gadgets;

        gears.map(async ({ id, name }) => {
          brawlerItems.push({
            userID: user.tag,
            brawlerID: brawlerID,
            itemID: id,
            itemKind: 'gear',
            itemName: name,
          });
          brawlerItemIDs.push(id);
        });

        starPowers.map(async ({ id, name }) => {
          brawlerItems.push({
            userID: user.tag,
            brawlerID: brawlerID,
            itemID: id,
            itemKind: 'starPower',
            itemName: name,
          });
          brawlerItemIDs.push(id);
        });

        gadgets.map(async ({ id, name }) => {
          brawlerItems.push({
            userID: user.tag,
            brawlerID: brawlerID,
            itemID: id,
            itemKind: 'gadget',
            itemName: name,
          });
          brawlerItemIDs.push(id);
        });
      });

      await this.userProfile.upsert(
        {
          userID: user.tag,
          name: user.name,
          profile: user.icon.id,
          clubID: user.club.tag,
          clubName: user.club.name,
          currentTrophies: user.trophies,
          highestTrophies: user.highestTrophies,
          tripleVictories: user['3vs3Victories'],
          duoVictories: user.duoVictories,
          rank25Brawlers: user.brawlers.filter(({ rank }) => rank >= 25).length,
          rank30Brawlers: user.brawlers.filter(({ rank }) => rank >= 30).length,
          rank35Brawlers: user.brawlers.filter(({ rank }) => rank >= 35).length,
          currentSoloPL: soloRankCurrent,
          highestSoloPL: soloRankHighest,
          currentTeamPL: teamRankCurrent,
          highestTeamPL: teamRankHighest,
        },
        ['userID'],
      );

      await this.userBrawlers.upsert(brawlers, ['userID', 'brawlerID']);
      await this.userBrawlerItems.upsert(brawlerItems, [
        'userID',
        'brawlerID',
        'itemID',
      ]);
    }
  }

  /** 최신 25개 전투 정보 확인 및 데이터베이스에 추가
   * @param battleLogs
   * @param userID 유저 태그
   */
  async insertUserBattles(battleLogs: any, userID: string) {
    const playersJSON = { teams: '' };

    // 게임 타입을 클럽 리그와 일반 게임 & 파워 리그 구분
    const getType = async (
      typeNumber: number,
      trophyChange: number,
      maxTrophies: number,
      currentPlayers: string,
      matchMode: number,
    ) => {
      if (typeNumber === 3 && [3, 5, 7, 9].includes(trophyChange)) {
        playersJSON.teams = currentPlayers;
        return 6;
      } else if (
        typeNumber === 0 &&
        [1, 2, 3, 4].includes(trophyChange) &&
        maxTrophies < 20 &&
        matchMode === 3
      ) {
        return 6;
      } else if (
        typeNumber === 3 &&
        playersJSON.teams === currentPlayers &&
        maxTrophies < 20
      ) {
        return 6;
      } else {
        playersJSON.teams = '';
        return typeNumber;
      }
    };

    const getGrade = async (matchType: number, highestTrophies: number) => {
      if ([2, 3, 6].includes(matchType)) {
        return highestTrophies;
      } else if ([4, 5].includes(matchType)) {
        return Math.floor(highestTrophies / 100);
      } else {
        if (highestTrophies < 40) {
          return 0;
        } else if (highestTrophies >= 40 && highestTrophies < 140) {
          return 1;
        } else if (highestTrophies >= 140 && highestTrophies < 300) {
          return 2;
        } else if (highestTrophies >= 300 && highestTrophies < 500) {
          return 3;
        } else if (highestTrophies >= 500 && highestTrophies < 750) {
          return 4;
        } else if (highestTrophies >= 750 && highestTrophies < 1000) {
          return 5;
        } else if (highestTrophies >= 1000 && highestTrophies < 1250) {
          return 6;
        } else {
          return 7;
        }
      }
    };

    // 전투 결과 수치형으로 변환
    const getResult = (teams: number, rank: number, result: number) => {
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

    const userTag = `#${userID}`;

    const userLastUpdate = await this.users
      .createQueryBuilder('u')
      .select('u.lastBattleAt', 'lastBattleAt')
      .getRawOne();

    const lastBattleDate = new Date(userLastUpdate.lastBattleAt);
    const lastBattleDateResponse = this.dateService.getDate(
      battleLogs?.items[0].battleTime,
    );
    const battles = [];

    if (lastBattleDate.toString() !== lastBattleDateResponse.toString()) {
      for (const item of battleLogs?.items) {
        if (item.event.id !== 0 && item.battle.type !== undefined) {
          const matchDate = this.dateService.getDate(item.battleTime);
          const duration =
            item.battle.duration != null && item.battle.duration > 0
              ? item.battle.duration
              : 0;
          const typeIndex = typeNameArray.indexOf(item.battle.type);

          const mapModeNumber: number = config.modeClass.tripleModes.includes(
            item.event.mode,
          )
            ? 3
            : config.modeClass.duoModes.includes(item.event.mode)
            ? 2
            : config.modeClass.soloModes.survive.includes(item.event.mode)
            ? 1
            : 0;
          const matchChange =
            item.battle.trophyChange !== undefined
              ? item.battle.trophyChange
              : 0;

          const teams =
            item.battle.teams !== undefined
              ? item.battle.teams
              : item.battle.players;
          const currentPlayers = JSON.stringify(teams);
          const highestTrophies = Math.max(
            ...teams.map((team) => {
              if ([3, 2].includes(mapModeNumber)) {
                return Math.max(
                  ...team.map(({ brawler }) => {
                    return brawler.trophies;
                  }),
                );
              } else if (mapModeNumber === 0) {
                return Math.max(
                  ...team.brawlers.map(({ trophies }) => {
                    return trophies;
                  }),
                );
              } else {
                return team.brawler.trophies;
              }
            }),
          );

          const matchType = await getType(
            typeIndex,
            matchChange,
            highestTrophies,
            currentPlayers,
            mapModeNumber,
          );
          const matchGrade = await getGrade(matchType, highestTrophies);

          if (new Date(lastBattleDate) < matchDate) {
            const match = {
              result: resultNameArray.indexOf(item.battle.result) - 1,
              brawler: 0,
            };

            for (const teamNumber in teams) {
              const players = [2, 3].includes(mapModeNumber)
                ? teams[teamNumber]
                : teams;
              const teamResult = players
                .map((item) => item.tag)
                .includes(userTag)
                ? resultNameArray.indexOf(item.battle.result) - 1
                : (resultNameArray.indexOf(item.battle.result) - 1) * -1;

              for (const playerNumber in players) {
                const matchRank: number =
                  mapModeNumber === 1
                    ? parseInt(playerNumber)
                    : mapModeNumber === 2
                    ? parseInt(teamNumber)
                    : -1;
                const matchResult = getResult(
                  teams.length,
                  matchRank,
                  teamResult,
                );

                if (mapModeNumber === 0) {
                  for (const brawler of players[playerNumber]?.brawlers) {
                    battles.push(<UserBattles>{
                      userID: userTag,
                      playerID: players[playerNumber].tag,
                      brawlerID: brawler.id,
                      matchDate: matchDate,
                      mapID: item.event.id,
                      modeCode: mapModeNumber,
                      matchType: matchType,
                      matchTypeRaw: typeIndex,
                      matchGrade: matchGrade,
                      duration: duration,
                      matchRank: matchRank,
                      matchResult: matchResult,
                      matchChange: 0,
                      matchChangeRaw: brawler.trophyChange,
                      playerName: players[playerNumber].name,
                      teamNumber: parseInt(teamNumber),
                      isStarPlayer: false,
                      brawlerPower: brawler.power,
                      brawlerTrophies: brawler.trophies,
                    });
                  }
                } else {
                  const isStarPlayer =
                    item.battle.starPlayer !== undefined &&
                    item.battle.starPlayer !== null &&
                    players[playerNumber].tag === item.battle.starPlayer.tag;

                  if (players[playerNumber].tag === userTag) {
                    match.result = matchResult;
                    match.brawler = players[playerNumber].brawler.id;
                  }

                  battles.push(<UserBattles>{
                    userID: userTag,
                    playerID: players[playerNumber].tag,
                    brawlerID: players[playerNumber].brawler.id,
                    matchDate: matchDate,
                    mapID: item.event.id,
                    modeCode: mapModeNumber,
                    matchType: matchType,
                    matchTypeRaw: typeIndex,
                    matchGrade: matchGrade,
                    duration: duration,
                    matchRank: matchRank,
                    matchResult: matchResult,
                    matchChange: matchChange,
                    matchChangeRaw: 0,
                    playerName: players[playerNumber].name,
                    teamNumber: [1, 2].includes(mapModeNumber)
                      ? matchRank
                      : parseInt(teamNumber),
                    isStarPlayer: isStarPlayer,
                    brawlerPower: players[playerNumber].brawler.power,
                    brawlerTrophies: players[playerNumber].brawler.trophies,
                  });
                }
              }
            }
          }

          if (matchType === 6) {
            await this.userBattles
              .createQueryBuilder()
              .update()
              .set({
                matchType: matchType,
              })
              .where('userID = :id', {
                id: userTag,
              })
              .andWhere('matchDate = :date', {
                date: matchDate,
              })
              .execute();
          }
        }
      }
    } // battleLogs 탐색 종료

    await this.userBattles
      .createQueryBuilder()
      .insert()
      .into('USER_BATTLES')
      .values(battles)
      .orIgnore()
      .execute();
  }
}
