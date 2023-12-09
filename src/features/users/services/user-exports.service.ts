import { HttpService } from '@nestjs/axios';
import { NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import UserBattlesService from '~/users/services/user-battles.service';
import { Users } from '~/users/entities/users.entity';
import { catchError, firstValueFrom, map } from 'rxjs';
import { CreateUserProfileDto } from '~/users/dto/create-user-profile.dto';
import { UserResponseType } from '~/interfaces/types/user-response.type';
import SeasonsService from '~/seasons/seasons.service';
import {
  UserBrawlerItems,
  UserBrawlers,
} from '~/users/entities/user-brawlers.entity';
import { UserBattles } from '~/users/entities/user-battles.entity';
import { UserProfile } from '~/users/entities/user-profile.entity';
import { BrawlerItems } from '~/brawlers/entities/brawlers.entity';

export default class UserExportsService {
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
    @InjectRepository(UserBrawlerItems)
    private readonly userBrawlerItems: Repository<UserBrawlerItems>,
    @InjectRepository(BrawlerItems)
    private readonly brawlerItems: Repository<BrawlerItems>,
    private readonly userBattlesService: UserBattlesService,
    private readonly seasonsService: SeasonsService,
    private readonly httpService: HttpService,
  ) {}

  /** 사용자 프로필 반환
   * @param userID 사용자 ID */
  async getUser(userID: string) {
    return firstValueFrom(
      this.httpService.get(`players/%23${userID}`).pipe(
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
  async getUserIDs() {
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
    const season = await this.seasonsService.selectRecentSeason();

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
            date: season.beginDate,
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
      const brawlerGears = [];

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
          });
          brawlerGears.push({
            id: id,
            brawlerID: brawlerID,
            kind: 'gear',
            name: name,
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
  async updateUserCycle() {
    await this.users
      .createQueryBuilder()
      .update()
      .set({
        isCycle: true,
      })
      .execute();
  }

  /** isCycle false인 사용자 ID들 반환 */
  async getUserEmptyCycle() {
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
      /** @type Date 전투 기록 변경 후 최근 전투 시간 반환 */
      await this.userBattlesService.insertUserBattles(battleLogs, userID);
      await this.userBattlesService.updateUserBrawlerBattles(userID);
    } catch (error) {
      // FA
    }
  }

  /** 사용자 전투 기록 응답 반환 */
  setUserBattleResponse(user: string) {
    return {
      id: user,
      request: this.httpService.get(`players/%23${user}/battlelog`),
    };
  }

  private async updateUserBrawlerItems({ brawlerGears, brawlerItems }) {
    await this.brawlerItems
      .createQueryBuilder()
      .insert()
      .values(brawlerGears)
      .orIgnore()
      .execute();
    await this.userBrawlerItems
      .createQueryBuilder()
      .insert()
      .values(brawlerItems)
      .orIgnore()
      .execute();
  }
}
