import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { UserProfile } from '~/users/entities/user-profile.entity';
import { UserBattles } from '~/users/entities/user-battles.entity';
import {
  UserBrawlerItems,
  UserBrawlers,
} from '~/users/entities/user-brawlers.entity';
import { UserResponseType } from '~/interfaces/types/user-response.type';
import { CreateUserProfileDto } from '~/users/dto/create-user-profile.dto';
import SeasonsService from '~/seasons/seasons.service';

@Injectable()
export default class UserProfileService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(UserBattles)
    private readonly userBattles: Repository<UserBattles>,
    @InjectRepository(UserProfile)
    private readonly userProfile: Repository<UserProfile>,
    @InjectRepository(UserBrawlers)
    private readonly userBrawlers: Repository<UserBrawlers>,
    @InjectRepository(UserBrawlerItems)
    private readonly userBrawlerItems: Repository<UserBrawlerItems>,
    private readonly seasonsService: SeasonsService,
  ) {}

  /** 사용자 프로필과 사용자 브롤러 정보 추가
   * @param user 멤버 json
   */
  async updateUserProfile(user: UserResponseType) {
    const season = await this.seasonsService.selectRecentSeason();

    return await this.dataSource.transaction(async (manager) => {
      const userBattlesRepository = manager.withRepository(this.userBattles);
      const userProfileRepository = manager.withRepository(this.userProfile);
      const userBrawlersRepository = manager.withRepository(this.userBrawlers);
      const userBrawlerItemsRepository = manager.withRepository(
        this.userBrawlerItems,
      );

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
          .andWhere('ub.matchDate > :date', {
            date: season.beginDate,
          })
          .andWhere('ub.matchType = 0')
          .orderBy(`ub.matchDate`, 'ASC')
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
        getRankPL(user.tag, 2, 'matchDate'),
        getRankPL(user.tag, 3, 'matchDate'),
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

        gears.map(async ({ id }) => {
          brawlerItems.push({
            userID: user.tag,
            brawlerID: brawlerID,
            itemID: id,
          });
          brawlerItemIDs.push(id);
        });

        starPowers.map(async ({ id }) => {
          brawlerItems.push({
            userID: user.tag,
            brawlerID: brawlerID,
            itemID: id,
          });
          brawlerItemIDs.push(id);
        });

        gadgets.map(async ({ id }) => {
          brawlerItems.push({
            userID: user.tag,
            brawlerID: brawlerID,
            itemID: id,
          });
          brawlerItemIDs.push(id);
        });
      });

      // 사용자 프로필 추가
      await userProfileRepository.upsert(
        userProfileRepository.create(userProfile),
        ['user.id'],
      );
      // 사용자 브롤러 추가
      await userBrawlersRepository.upsert(brawlers, ['userID', 'brawlerID']);
      // 사용자 브롤러 아이템 추가
      await userBrawlerItemsRepository.upsert(brawlerItems, [
        'userID',
        'brawlerID',
        'itemID',
      ]);
    });
  }
}
