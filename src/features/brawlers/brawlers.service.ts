import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { firstValueFrom, map } from 'rxjs';
import { isMainThread } from 'worker_threads';

import { BrawlerItems, Brawlers } from './entities/brawlers.entity';
import { BattleStats } from '~/brawlers/entities/battle-stats.entity';
import { UserBattles } from '~/users/entities/user-battles.entity';
import { Maps } from '~/maps/entities/maps.entity';
import { CreateBrawlerDto } from '~/brawlers/dto/create-brawler.dto';
import { CreateBrawlerItemDto } from '~/brawlers/dto/create-brawler-item.dto';
import { BrawlerItemType, BrawlerType } from '~/interfaces/types/brawler.type';
import brawlerJSON from '~/public/json/brawlers.json';

@Injectable()
export default class BrawlersService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Brawlers)
    private brawlers: Repository<Brawlers>,
    @InjectRepository(BattleStats)
    private battleStats: Repository<BattleStats>,
    @InjectRepository(BrawlerItems)
    private brawlerItems: Repository<BrawlerItems>,
    @InjectRepository(UserBattles)
    private userBattles: Repository<UserBattles>,
    private readonly httpService: HttpService,
  ) {
    this.updateBrawlers().then(() => {
      Logger.log(`Brawler Data Initialized`, 'Brawlers');
    });
  }

  /** 브롤러 정보 추가 */
  async insertBrawler() {
    const brawlers: CreateBrawlerDto[] = [];
    const brawlerItems: CreateBrawlerItemDto[] = [];
    await firstValueFrom(
      this.httpService.get('/brawlers').pipe(
        map((res) => {
          res.data.items.map((brawler: BrawlerType) => {
            brawlers.push({
              id: brawler.id,
              name: brawler.name,
              rarity:
                brawlerJSON.items.find(
                  (item) => String(item?.id) === String(brawler.id),
                )?.rarity || null,
              role:
                brawlerJSON.items.find(
                  (item) => String(item?.id) === String(brawler.id),
                )?.class || null,
              gender:
                brawlerJSON.items.find(
                  (item) => String(item?.id) === String(brawler.id),
                )?.gender || null,
              icon:
                brawlerJSON.items.find(
                  (item) => item?.id.toString() === brawler.id,
                )?.icon || null,
            });

            brawler.starPowers.map((starPower: BrawlerItemType) => {
              brawlerItems.push({
                id: starPower.id,
                brawlerID: brawler.id,
                kind: 'starPower',
                name: starPower.name,
              });
            });

            brawler.gadgets.map((gadget: BrawlerItemType) => {
              brawlerItems.push({
                id: gadget.id,
                brawlerID: brawler.id,
                kind: 'gadget',
                name: gadget.name,
              });
            });
          });
        }),
      ),
    );

    await this.brawlers.upsert(brawlers, ['id']);
    await this.brawlerItems.upsert(brawlerItems, ['id', 'brawlerID']);
  }

  /** 전투 통계 갱신 */
  async updateBattleStats() {
    const battleStats = await this.dataSource.transaction(async (manager) => {
      const userBattlesRepository = manager.withRepository(this.userBattles);

      return await userBattlesRepository
        .createQueryBuilder('ub')
        .select('ub.brawlerID', 'brawlerID')
        .addSelect('ub.mapID', 'mapID')
        .addSelect('ub.matchType', 'matchType')
        .addSelect('ub.matchGrade', 'matchGrade')
        .addSelect('COUNT(*)', 'matchCount')
        .addSelect(
          'COUNT(CASE WHEN ub.gameResult = -1 THEN 1 ELSE NULL END)',
          'victoriesCount',
        )
        .addSelect(
          'COUNT(CASE WHEN ub.gameResult = 1 THEN 1 ELSE NULL END)',
          'defeatsCount',
        )
        .addSelect('m.mode', 'mode')
        .innerJoin(Maps, 'm', 'ub.mapID = m.id')
        .where('ub.matchType IN (0, 2, 3)')
        .andWhere('ub.modeCode = 3')
        .groupBy('ub.brawlerID')
        .addGroupBy('ub.mapID')
        .addGroupBy('ub.matchType')
        .addGroupBy('ub.matchGrade')
        .addGroupBy('m.mode')
        .getRawMany();
    });

    await this.battleStats.upsert(battleStats, [
      'mapID',
      'brawlerID',
      'matchType',
      'matchGrade',
    ]);
  }

  /** 브롤러 관련 정보 주기적 갱신 */
  @Cron('0 0-23/1 * * *')
  async updateBrawlers() {
    if (isMainThread) {
      await this.insertBrawler();
      await this.updateBattleStats();
    }
  }
}
