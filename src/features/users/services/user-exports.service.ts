import { HttpService } from '@nestjs/axios';
import { Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import UserBattlesService from '~/users/services/user-battles.service';
import { Users } from '~/users/entities/users.entity';
import { catchError, firstValueFrom, map } from 'rxjs';
import { CreateUserProfileDto } from '~/users/dto/create-user-profile.dto';
import { UserResponseType } from '~/common/types/user-response.type';
import SeasonService from '~/season/season.service';
import {
  UserBrawlerBattles,
  UserBrawlerItems,
  UserBrawlers,
} from '~/users/entities/user-brawlers.entity';
import { UserBattles } from '~/users/entities/user-battles.entity';
import { UserProfile } from '~/users/entities/user-profile.entity';
import { BrawlerItems } from '~/brawlers/entities/brawlers.entity';
import { SeasonDto } from '~/season/dto/season.dto';
import { CreateBrawlerItemDto } from '~/brawlers/dto/create-brawler-item.dto';
import BrawlersService from '~/brawlers/brawlers.service';
import { Cron } from '@nestjs/schedule';

export default class UserExportsService {
  private brawlerItemsData = [];

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Users)
    private readonly users: Repository<Users>,
    @InjectRepository(UserProfile)
    private readonly userProfile: Repository<UserProfile>,
    @InjectRepository(UserBattles)
    private readonly userBattles: Repository<UserBattles>,
    @InjectRepository(UserBrawlers)
    private readonly userBrawlers: Repository<UserBrawlers>,
    @InjectRepository(UserBrawlerBattles)
    private readonly userBrawlerBattles: Repository<UserBrawlerBattles>,
    @InjectRepository(UserBrawlerItems)
    private readonly userBrawlerItems: Repository<UserBrawlerItems>,
    @InjectRepository(BrawlerItems)
    private readonly brawlerItems: Repository<BrawlerItems>,
    private readonly userBattlesService: UserBattlesService,
    private readonly brawlersService: BrawlersService,
    private readonly seasonsService: SeasonService,
    private readonly httpService: HttpService,
  ) {
    this.updateBrawlerItems().then(() => {});
  }

  /** 사용자 프로필 반환
   * @param userID 사용자 ID */
  fetchUserResponse(userID: string) {
    return firstValueFrom(
      this.httpService.get(`/players/%23${userID}`).pipe(
        map((res) => {
          return res.data;
        }),
        catchError(() => {
          throw new NotFoundException(`User ${userID} not Found`);
        }),
      ),
    );
  }

  /** 전체 사용자 ID 반환 */
  async getUserIDs(): Promise<string[]> {
    return await this.users
      .createQueryBuilder('u')
      .select('REPLACE(u.id, "#", "")', 'userID')
      .orderBy('u.lastBattledOn', 'ASC')
      .getRawMany()
      .then((result) => {
        return result.map((user) => user.userID);
      });
  }

  /** 사용자 프로필과 사용자 브롤러 정보 추가
   * @param user 멤버 json
   */
  async updateUserProfile(user: UserResponseType) {
    const season = this.seasonsService.getRecentSeason();

    const brawlerItems = await this.dataSource.transaction(async (manager) => {
      const userBattlesRepository = manager.withRepository(this.userBattles);
      const userProfileRepository = manager.withRepository(this.userProfile);
      const userBrawlersRepository = manager.withRepository(this.userBrawlers);

      /** 파워 리그 랭크 반환
       * @param id 사용자 ID
       * @param typeNum 게임 타입 번호
       * @param column 열 이름 */
      const getRankPL = async (id: string, typeNum: number, column: string) => {
        return await userBattlesRepository
          .createQueryBuilder('ub')
          .select('ub.brawlerTrophies', 'brawlerTrophies')
          .where('ub.userID = :id AND ub.playerID = :id', {
            id: id,
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

      /** 파워 리그 랭크 반환
       * @param id 사용자 ID
       * @param brawlerID 브롤러 ID
       * @param currentTrophies 현재 트로피 개수 */
      const getTrophyBegin = async (
        id: string,
        brawlerID: string,
        currentTrophies: number,
      ) => {
        return await userBattlesRepository
          .createQueryBuilder('ub')
          .select('ub.brawlerTrophies', 'brawlerTrophies')
          .where('ub.userID = :id AND ub.playerID = :id', {
            id: id,
          })
          .andWhere('ub.brawlerID = :brawlerID', {
            brawlerID: brawlerID,
          })
          .andWhere('ub.battleTime > :date', {
            date: season.beginTime,
          })
          .andWhere('ub.matchType = 0')
          .orderBy(`ub.battleTime`, 'ASC')
          .getRawOne()
          .then((result) => {
            return result != null ? result.brawlerTrophies : currentTrophies;
          });
      };

      // 사용자 프로필 정보 저장
      const [
        soloRankCurrent,
        teamRankCurrent,
        soloRankHighest,
        teamRankHighest,
      ] = await Promise.all([
        getRankPL(user.tag, 2, 'battleTime'),
        getRankPL(user.tag, 3, 'battleTime'),
        getRankPL(user.tag, 2, 'brawlerTrophies'),
        getRankPL(user.tag, 3, 'brawlerTrophies'),
      ]);

      const userProfile: CreateUserProfileDto = {
        userID: user.tag,
        name: user.name,
        profileIcon: user.icon.id,
        clubID: user.club.tag,
        clubName: user.club.name,
        currentTrophies: user.trophies,
        highestTrophies: user.highestTrophies,
        trioMatchVictories: user['3vs3Victories'],
        duoMatchVictories: user.duoVictories,
        soloMatchVictories: user.soloVictories,
        brawlerRank25: user.brawlers.filter(({ rank }) => rank >= 25).length,
        brawlerRank30: user.brawlers.filter(({ rank }) => rank >= 30).length,
        brawlerRank35: user.brawlers.filter(({ rank }) => rank >= 35).length,
        currentSoloPL: soloRankCurrent,
        highestSoloPL: soloRankHighest,
        currentTeamPL: teamRankCurrent,
        highestTeamPL: teamRankHighest,
      };

      // 사용자 브롤러와 사용자 브롤러 아이템 정보 저장
      const brawlers = [];
      const brawlerItems = [];
      const brawlerGears: CreateBrawlerItemDto[] = [];

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
        const brawlerItemAssets = this.brawlerItemsData;

        gears.map(async ({ id, name }) => {
          brawlerItems.push({
            userID: user.tag,
            brawlerID: brawlerID,
            itemID: id,
          });
          brawlerGears.push({
            id: id,
            brawlerID: brawlerID,
            kind: 'gear',
            name: name,
            values: brawlerItemAssets.find((item) => item.id === id).values,
          });
        });

        starPowers.map(async ({ id }) => {
          brawlerItems.push({
            userID: user.tag,
            brawlerID: brawlerID,
            itemID: id,
          });
        });

        gadgets.map(async ({ id }) => {
          brawlerItems.push({
            userID: user.tag,
            brawlerID: brawlerID,
            itemID: id,
          });
        });
      });

      // 사용자 프로필 추가
      await userProfileRepository.upsert(
        userProfileRepository.create(userProfile),
        ['userID'],
      );
      // 사용자 브롤러 추가
      await userBrawlersRepository.upsert(brawlers, ['userID', 'brawlerID']);

      return { brawlerItems, brawlerGears };
    });

    await this.updateUserBrawlerItems(brawlerItems);
  }

  /** 모든 사용자 isCycle 값 변경 */
  async updateUserIsCycle(userID: string) {
    await this.users.update({ id: userID }, { isCycle: true });
  }

  /** isCycle false인 사용자 ID들 반환 */
  async getUserIDsIsNotCycle(): Promise<string[]> {
    return await this.users
      .createQueryBuilder('u')
      .select('REPLACE(u.id, "#", "")', 'userID')
      .where('u.isCycle = FALSE')
      .getRawMany()
      .then((result) => {
        return result.map((item) => item.userID);
      });
  }

  /** 사용자 전투 기록 관리
   * @param battleLogs 사용자 ID
   * @param userID 요청 순환 여부 */
  async updateUserBattlesByResponse(battleLogs: any, userID: string) {
    try {
      /** 최근 전투 시간 반환 */
      await this.userBattlesService.insertUserBattles(battleLogs, userID);
      await this.userBattlesService.updateUserBrawlerBattles(userID);
    } catch (err) {
      Logger.error(err);
    }
  }

  /** 사용자 전투 기록 응답 반환 */
  fetchUserBattleResponse(user: string) {
    return {
      id: user,
      request: this.httpService.get(`/players/%23${user}/battlelog`),
    };
  }

  deleteUser(userID: string) {
    this.users
      .softDelete({
        id: `#${userID}`,
      })
      .then((result) =>
        Logger.log(
          `${userID} has been SoftDeleted ${result.affected}`,
          'DeleteUser',
        ),
      );
  }

  async updateSeason() {
    await this.userBrawlerBattles.delete({});
  }

  async deleteUserBattles(season: SeasonDto) {
    const beginTime = season.beginTime;
    beginTime.setHours(season.beginTime.getHours() + 9);
    const battleTimes: string[] = await this.userBattles
      .createQueryBuilder('user')
      .select('user.battleTime', 'battleTime')
      .where('UNIX_TIMESTAMP(user.battleTime) < UNIX_TIMESTAMP(:date)', {
        date: `${beginTime.toISOString().slice(0, 19).replace('T', ' ')}`,
      })
      .orderBy('user.battleTime', 'ASC')
      .limit(5000)
      .getRawMany()
      .then((result) => result.map((item) => item.battleTime));

    await this.userBattles
      .createQueryBuilder()
      .delete()
      .where('battleTime IN (:ids)', {
        ids: battleTimes.length > 0 ? battleTimes : ['2000-01-01 18:00:00'],
      })
      .execute();
  }

  @Cron('30 * * * *')
  async updateBrawlerItems() {
    this.brawlerItemsData = await this.brawlersService.getBrawlerItems();
  }

  private async updateUserBrawlerItems({ brawlerGears, brawlerItems }) {
    await this.brawlerItems.upsert(brawlerGears, ['id', 'brawlerID']);
    await this.userBrawlerItems.upsert(brawlerItems, ['itemID']);
  }
}
