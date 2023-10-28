import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { UserBattles, UserProfile } from '~/users/entities/users.entity';
import {
  UserBrawlerItems,
  UserBrawlers,
} from '~/users/entities/user-brawlers.entity';
import { Injectable } from '@nestjs/common';
import { Seasons } from '~/seasons/entities/seasons.entity';
import { UserResponse } from '~/interfaces/types/userResponse';

@Injectable()
export default class UserProfileService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(UserBattles) private userBattles: Repository<UserBattles>,
    @InjectRepository(UserProfile)
    private userProfile: Repository<UserProfile>,
    @InjectRepository(UserBrawlers)
    private userBrawlers: Repository<UserBrawlers>,
    @InjectRepository(UserBrawlerItems)
    private userBrawlerItems: Repository<UserBrawlerItems>,
  ) {}

  /** 멤버 기록과 소유 브롤러 정보 데이터베이스에 추가
   * @param user 멤버 json
   * @param season 최근 시즌
   */
  async updateUserProfile(user: UserResponse, season: Seasons) {
    return await this.dataSource.transaction(async (manager) => {
      const userBattlesRepository = manager.withRepository(this.userBattles);
      const userProfileRepository = manager.withRepository(this.userProfile);
      const userBrawlersRepository = manager.withRepository(this.userBrawlers);
      const userBrawlerItemsRepository = manager.withRepository(
        this.userBrawlerItems,
      );

      const getRankPL = async (typeNum: number, tag: string, column) => {
        return await userBattlesRepository
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

      const getTrophyBegin = async (
        tag: string,
        brawlerID: string,
        current: number,
      ) => {
        return await userBattlesRepository
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

      await userProfileRepository.upsert(
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

      await userBrawlersRepository.upsert(brawlers, ['userID', 'brawlerID']);
      await userBrawlerItemsRepository.upsert(brawlerItems, [
        'userID',
        'brawlerID',
        'itemID',
      ]);
    });
  }
}
