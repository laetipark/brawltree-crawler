import { HttpService } from '@nestjs/axios';

import { Injectable, Logger } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';

import { UserBattles, Users } from '~/users/entities/users.entity';
import { UserBrawlerBattles } from '~/users/entities/user-brawlers.entity';
import { CreateUserBattlesDto } from '~/users/dto/create-userBattles.dto';

import DateService from '~/utils/date.service';
import UserRequest from '~/interfaces/types/userRequest';
import AppConfigService from '~/configs/app-config.service';

const typeNameArray = [
  'ranked',
  'friendly',
  'soloRanked',
  'teamRanked',
  'challenge',
  'championshipChallenge',
];
const resultNameArray = ['victory', 'draw', 'defeat'];

@Injectable()
export default class UserBattlesService {
  userRequests: UserRequest[] = [];
  pendingRequests: UserRequest[] = [];
  private readonly maxRequests: number = 2;

  constructor(
    private dataSource: DataSource,
    @InjectRepository(Users) private users: Repository<Users>,
    @InjectRepository(UserBattles) private userBattles: Repository<UserBattles>,
    @InjectRepository(UserBrawlerBattles)
    private userBrawlerBattles: Repository<UserBrawlerBattles>,
    private readonly dateService: DateService,
    private readonly httpService: HttpService,
    private readonly configService: AppConfigService,
  ) {}

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
      const response = await firstValueFrom(
        this.httpService.get(`players/%23${userID}/battlelog`),
      );

      /** Player Battle Logs */
      const battleLogs = response.data;

      /** Insert User Battle Logs */
      battleLogs && (await this.insertUserBattles(battleLogs, userID));

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
          cycleCount: 0,
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
    } catch (error) {
      Logger.error(JSON.stringify(error.response?.data), userID);
      console.log(error.cause);
      const errorTime = error.response?.status === 404 ? 50 : 0;

      if (error.response?.status === 404) {
        await this.users
          .createQueryBuilder(`u`)
          .update()
          .set({
            cycleCount: () => `cycleCount + 1`,
          })
          .where('userID = :id', {
            id: `#${userID}`,
          })
          .execute();
      }

      const user = await this.users
        .createQueryBuilder(`u`)
        .select(`u.cycleCount`, `cycleCount`)
        .where('u.userID = :id', {
          id: `#${userID}`,
        })
        .getRawOne();

      if ((user?.cycleCount || 0) > 9) {
        await this.users.softDelete({
          userID: `#${userID}`,
        });
      } else {
        /** 10(60)분 후에 manageUserRequests 실행 */
        setTimeout(
          () => {
            this.manageUserRequests(userID, cycle);
          },
          (10 + errorTime) * 60 * 1000,
        );
      }
    } finally {
      /** @type number 현재 요청 index
       * 요청이 완료되면 현재 요청을 지우고 다음 요청을 확인하고 실행 */
      const index: number = this.userRequests.findIndex(
        (item) => item.userID === userID,
      );

      if (index !== -1) {
        this.userRequests.splice(index, 1);
      }

      setTimeout(async () => {
        const nextRequest = this.pendingRequests.shift();
        if (nextRequest) {
          const { userID, cycle } = nextRequest;
          await this.manageUserRequests(userID, cycle);
        }
      }, 30000);
    }
  }

  /** Update User's Brawler Battles
   * @param userID User ID */
  async updateUserBrawlerBattles(userID: string) {
    await this.dataSource.transaction(async (manager) => {
      const userBattlesRepository = manager.withRepository(this.userBattles);
      const userBrawlerBattlesRepository = manager.withRepository(
        this.userBrawlerBattles,
      );

      const battles = await userBattlesRepository
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

      await userBrawlerBattlesRepository.save(battles);
    });
  }

  /** 최신 25개 전투 정보 확인 및 데이터베이스에 추가
   * @param battleLogs
   * @param userID 유저 태그
   */
  async insertUserBattles(battleLogs: any, userID: string) {
    // 브롤러 트로피 개수 별 전투 등급 반환
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

    await this.dataSource.transaction(async (manager) => {
      const usersRepository = manager.withRepository(this.users);

      const userLastUpdate = await usersRepository
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

            const mapModeNumber: number = (
              await this.configService.getModeClass()
            ).tripleModes.includes(item.event.mode)
              ? 3
              : (await this.configService.getModeClass()).duoModes.includes(
                  item.event.mode,
                )
              ? 2
              : (
                  await this.configService.getModeClass()
                ).soloModes.survive.includes(item.event.mode)
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

            const matchType = typeIndex;
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
                  .map(({ tag }) => tag)
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

                    battles.push(<CreateUserBattlesDto>{
                      userID: userTag,
                      playerID: players[playerNumber].tag,
                      brawlerID: players[playerNumber].brawler.id,
                      matchDate: matchDate,
                      mapID: item.event.id,
                      modeCode: mapModeNumber,
                      matchType: matchType,
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
          }
        }
      } // battleLogs 탐색 종료

      await manager
        .createQueryBuilder()
        .insert()
        .into(UserBattles)
        .values(battles)
        .orIgnore()
        .execute();
    });
  }
}
