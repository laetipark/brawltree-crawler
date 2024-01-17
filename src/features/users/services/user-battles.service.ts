import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import MapsService from '~/maps/maps.service';
import DateService from '~/utils/services/date.service';
import AppConfigService from '~/utils/services/app-config.service';
import { Users } from '~/users/entities/users.entity';
import { UserBattles } from '~/users/entities/user-battles.entity';
import { UserBrawlerBattles } from '~/users/entities/user-brawlers.entity';
import { CreateUserBattleDto } from '~/users/dto/create-userBattle.dto';
import { CreateMapDto } from '~/maps/dto/create-map.dto';
import SeasonService from '~/season/season.service';

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
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Users)
    private readonly users: Repository<Users>,
    @InjectRepository(UserBattles)
    private readonly userBattles: Repository<UserBattles>,
    @InjectRepository(UserBrawlerBattles)
    private readonly userBrawlerBattles: Repository<UserBrawlerBattles>,
    private readonly mapsService: MapsService,
    private readonly dateService: DateService,
    private readonly seasonsService: SeasonService,
    private readonly configService: AppConfigService,
  ) {}

  /** 사용자 브롤러 전투 정보 업데이트
   * @param id 사용자 ID */
  async updateUserBrawlerBattles(id: string) {
    await this.dataSource.transaction(async (manager) => {
      const userBattlesRepository = manager.withRepository(this.userBattles);
      const userBrawlerBattlesRepository = manager.withRepository(
        this.userBrawlerBattles,
      );

      const brawlerBattles = await userBattlesRepository
        .createQueryBuilder('ub')
        .select('ub.brawlerID', 'brawlerID')
        .addSelect('ub.mapID', 'mapID')
        .addSelect('ub.matchType', 'matchType')
        .addSelect('ub.matchGrade', 'matchGrade')
        .addSelect('COUNT(*)', 'matchCount')
        .addSelect(
          'COUNT(CASE WHEN ub.gameResult = -1 THEN 1 END)',
          'victoriesCount',
        )
        .addSelect(
          'COUNT(CASE WHEN ub.gameResult = 1 THEN 1 END)',
          'defeatsCount',
        )
        .where('ub.userID = :id AND ub.playerID = :id', {
          id: `#${id}`,
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
              userID: `#${id}`,
              brawlerID: battle.brawlerID,
              mapID: battle.mapID,
              matchType: battle.matchType,
              matchGrade: battle.matchGrade,
              matchCount: battle.matchCount,
              victoriesCount: battle.victoriesCount,
              defeatsCount: battle.defeatsCount,
            };
          });
        });

      await userBrawlerBattlesRepository.upsert(brawlerBattles, [
        'userID',
        'brawlerID',
        'mapID',
        'matchType',
        'matchGrade',
      ]);
    });
  }

  /** 최신 25개 전투 정보 확인 및 데이터베이스에 추가
   * @param battleLogs
   * @param id 유저 태그
   */
  async insertUserBattles(battleLogs: any, id: string) {
    /** 브롤러 트로피 개수 별 전투 등급(랭크) 반환
     * @param type 전투 타입
     * @param highestTrophies 최고 트로피 개수 */
    const getGrade = async (type: number, highestTrophies: number) => {
      if ([2, 3, 6].includes(type)) {
        return highestTrophies;
      } else if ([4, 5].includes(type)) {
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

    /** 전투 결과 수치형으로 변환
     * @param teams 전투 팀 개수
     * @param teamNumber 팀 번호(쇼다운 팀 순위)
     * @param result 트리오 모드 전투 결과 */
    const getResult = (teams: number, teamNumber: number, result: number) => {
      if (teams > 2) {
        const rank = teamNumber / (2 / (10 / teams));
        if (rank < 2) {
          return -1;
        } else if (rank < 3) {
          return 0;
        } else {
          return 1;
        }
      } else {
        return result;
      }
    };

    // 사용자 tag와 사용자 마지막 전투 시간
    const userID = `#${id}`;
    const user = await this.users.findOne({ where: { id: userID } });

    /** 사용자 최근 전투 시간 반환
     * @return lastBattleDateResponse 최근 전투 시간 반환 */
    const lastBattleDate = await this.dataSource.transaction(
      async (manager) => {
        const userBattlesRepository = manager.withRepository(this.userBattles);

        const rawBattles = battleLogs.items.filter((battle: any) => {
          return battle.event.id !== 0;
        });

        const lastBattleDate = new Date(user.lastBattledOn);
        const lastBattleDateResponse =
          rawBattles.length > 0
            ? this.dateService.getDate(rawBattles[0].battleTime)
            : lastBattleDate;

        const battles: CreateUserBattleDto[] = [];
        const maps: CreateMapDto[] = [];

        if (lastBattleDate !== lastBattleDateResponse) {
          for (const item of rawBattles) {
            // 전투 시작 시각
            const battleTime = this.dateService.getDate(item.battleTime);

            if (
              item.event.id !== 0 &&
              item.battle.type !== undefined &&
              this.seasonsService.getRecentSeason().beginTime < battleTime
            ) {
              maps.push({
                id: item.event.id,
                mode: item.event.mode,
                name: item.event.map,
              });

              // 전투 시간
              const duration =
                item.battle.duration != null && item.battle.duration > 0
                  ? item.battle.duration
                  : 0;
              // 전투 타입
              const matchType = typeNameArray.indexOf(item.battle.type);

              /** @type number 게임 모드 번호
               * 3: 트리오 모드 / 2: 듀오 모드 / 1: 솔로 모드 / 0: 듀얼 */
              const modeCode: number = this.configService
                .getModeClass()
                .tripleModes.includes(item.event.mode)
                ? 3
                : this.configService
                      .getModeClass()
                      .duoModes.includes(item.event.mode)
                  ? 2
                  : this.configService
                        .getModeClass()
                        .soloModes.survive.includes(item.event.mode)
                    ? 1
                    : 0;
              const trophyChange =
                item.battle.trophyChange !== undefined
                  ? item.battle.trophyChange
                  : 0;

              // 전투 팀 배열 설정
              const teams =
                item.battle.teams !== undefined
                  ? item.battle.teams
                  : item.battle.players;

              // 전투에서 가장 트로피 개수 높은 사용자
              const highestTrophies = Math.max(
                ...teams.map((team) => {
                  if ([3, 2].includes(modeCode)) {
                    return Math.max(
                      ...team.map(({ brawler }) => {
                        return brawler.trophies;
                      }),
                    );
                  } else if (modeCode === 0) {
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

              // 전투 등급
              const matchGrade = await getGrade(matchType, highestTrophies);

              // 전투 기록 플레이어 정보 저장
              if (new Date(lastBattleDate) < battleTime) {
                const match = {
                  result: resultNameArray.indexOf(item.battle.result) - 1,
                  brawler: 0,
                };

                for (const teamNumber in teams) {
                  const players = [2, 3].includes(modeCode)
                    ? teams[teamNumber]
                    : teams;
                  const teamResult = players
                    .map(({ tag }) => tag)
                    .includes(userID)
                    ? resultNameArray.indexOf(item.battle.result) - 1
                    : (resultNameArray.indexOf(item.battle.result) - 1) * -1;

                  for (const playerNumber in players) {
                    const gameRank: number =
                      modeCode === 1
                        ? parseInt(playerNumber)
                        : modeCode === 2
                          ? parseInt(teamNumber)
                          : -1;
                    const gameResult = getResult(
                      teams.length,
                      gameRank,
                      teamResult,
                    );

                    if (modeCode === 0) {
                      for (const brawler of players[playerNumber]?.brawlers) {
                        battles.push({
                          userID,
                          playerID: players[playerNumber].tag,
                          brawlerID: brawler.id,
                          battleTime,
                          mapID: item.event.id,
                          modeCode,
                          matchType,
                          matchGrade,
                          duration,
                          gameRank,
                          gameResult,
                          trophyChange: 0,
                          duelsTrophyChange: brawler.trophyChange,
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
                        players[playerNumber].tag ===
                          item.battle.starPlayer.tag;

                      if (players[playerNumber].tag === userID) {
                        match.result = gameResult;
                        match.brawler = players[playerNumber].brawler.id;
                      }

                      battles.push({
                        userID,
                        playerID: players[playerNumber].tag,
                        brawlerID: players[playerNumber].brawler.id,
                        battleTime,
                        mapID: item.event.id,
                        modeCode,
                        matchType,
                        matchGrade,
                        duration,
                        gameRank,
                        gameResult,
                        trophyChange,
                        duelsTrophyChange: 0,
                        playerName: players[playerNumber].name,
                        teamNumber: [1, 2].includes(modeCode)
                          ? gameRank
                          : parseInt(teamNumber),
                        isStarPlayer,
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

        // 맵 정보 추가
        const mapIDs = Array.from(new Set(maps.map((item) => item.id)));
        this.mapsService.setMaps(
          mapIDs.map((id) => maps.find((item) => item.id === id)),
        );

        // 사용자 전투 기록 추가
        await userBattlesRepository.upsert(battles, [
          'userID',
          'playerID',
          'brawlerID',
          'battleTime',
        ]);
        return lastBattleDateResponse;
      },
    );

    user.isCycle = false;
    user.lastBattledOn = lastBattleDate;
    // 사용자 최근 전투 시간 변경
    await this.users.upsert(user, ['id']);
  }
}
