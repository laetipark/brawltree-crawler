import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { firstValueFrom, map } from 'rxjs';
import { isMainThread } from 'worker_threads';

import { Brawlers } from './entities/brawlers.entity';
import { BattleStats } from '~/brawlers/entities/battle-stats.entity';
import { UserBattles } from '~/users/entities/user-battles.entity';
import { Maps } from '~/maps/entities/maps.entity';
import brawlerJSON from '~/public/json/brawlers.json';

@Injectable()
export default class BrawlersService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Brawlers)
    private brawlers: Repository<Brawlers>,
    @InjectRepository(UserBattles)
    private userBattles: Repository<UserBattles>,
    private readonly httpService: HttpService,
  ) {
    this.insertBrawler().then(() => {
      Logger.log(`Brawler Data Initialized`, 'Brawlers');
    });
  }

  /** 브롤러 정보 추가 */
  async insertBrawler() {
    const brawlers = await firstValueFrom(
      this.httpService.get('/brawlers').pipe(
        map((res) => {
          return res.data.items.map((brawler: any) => {
            return {
              id: brawler.id,
              name: brawler.name,
              rarity:
                brawlerJSON.items.find((item) => item?.id === brawler.id)
                  ?.rarity || null,
              role:
                brawlerJSON.items.find((item) => item?.id === brawler.id)
                  ?.class || null,
              gender:
                brawlerJSON.items.find((item) => item?.id === brawler.id)
                  ?.gender || null,
              icon:
                brawlerJSON.items.find((item) => item?.id === brawler.id)
                  ?.icon || null,
            };
          });
        }),
      ),
    );

    await this.brawlers.upsert(brawlers, ['id']);
  }

  /** 전투 통계 갱신 */
  async updateBattleStats() {
    await this.dataSource.transaction(async (manager) => {
      const userBattlesRepository = manager.withRepository(this.userBattles);

      const brawlerStats = await userBattlesRepository
        .createQueryBuilder('ub')
        .select('ub.brawlerID', 'brawlerID')
        .addSelect('ub.mapID', 'mapID')
        .addSelect('ub.matchType', 'matchType')
        .addSelect('ub.matchGrade', 'matchGrade')
        .addSelect('COUNT(*)', 'matchCount')
        .addSelect(
          'COUNT(CASE WHEN ub.gameResult = -1 THEN 1 ELSE NULL END)',
          'victoryCount',
        )
        .addSelect(
          'COUNT(CASE WHEN ub.gameResult = 1 THEN 1 ELSE NULL END)',
          'defeatCount',
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

      brawlerStats &&
        (await manager
          .createQueryBuilder()
          .insert()
          .into(BattleStats)
          .values(brawlerStats)
          .orIgnore()
          .execute());
    });
  }

  /** 브롤러 관련 정보 주기적 갱신 */
  @Cron('0 0-23/1 * * *')
  async updateBrawlers() {
    if (isMainThread) {
      const date = new Date();
      date.setSeconds(0);
      date.setMilliseconds(0);

      await this.insertBrawler();
      await this.updateBattleStats();
    }
  }
}
