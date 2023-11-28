import { DataSource, Repository } from 'typeorm';
import { Brawlers } from './entities/brawlers.entity';

import brawlerJSON from '~/public/json/brawlers.json';

import { UserBattles } from '~/users/entities/user-battles.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, map } from 'rxjs';
import { Maps } from '~/maps/entities/maps.entity';
import { BattleStats } from '~/brawlers/entities/battle-stats.entity';
import { Cron } from '@nestjs/schedule';
import DateService from '~/utils/services/date.service';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isMainThread } from 'worker_threads';

@Injectable()
export default class BrawlersService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Brawlers)
    private brawlers: Repository<Brawlers>,
    @InjectRepository(UserBattles)
    private userBattles: Repository<UserBattles>,
    private readonly dateService: DateService,
    private readonly httpService: HttpService,
  ) {
    this.insertBrawler().then(() => {
      Logger.log(`Brawler Data Initialized`, 'Brawlers');
    });
  }

  async insertBrawler() {
    const brawlers = await firstValueFrom(
      this.httpService.get('/brawlers').pipe(
        map((res) => {
          return res.data.items.map((brawler) => {
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

  /*async updateBattleTrio(date: string) {
    await this.dataSource.transaction(async (manager) => {
      const battleTrios = await manager
        .createQueryBuilder()
        .select(`CAST("${date}" AS DATETIME)`, 'aggregationDate')
        .addSelect('sq.mapID', 'mapID')
        .addSelect('sq.matchType', 'matchType')
        .addSelect('sq.matchGrade', 'matchGrade')
        .addSelect('sq.trio', 'trio')
        .addSelect('SUM(CAST(sq.matchCount AS UNSIGNED))', 'matchCount')
        .addSelect('SUM(CAST(sq.victoryCount AS UNSIGNED))', 'victoryCount')
        .addSelect('SUM(CAST(sq.defeatCount AS UNSIGNED))', 'defeatCount')
        .addSelect('sq.mode', 'mode')
        .from((subQuery) => {
          return subQuery
            .select('ub.mapID', 'mapID')
            .addSelect('ub.matchType', 'matchType')
            .addSelect('ub.matchGrade', 'matchGrade')
            .addSelect('m.mode', 'mode')
            .addSelect(
              'GROUP_CONCAT(DISTINCT ub.brawlerID ORDER BY ub.brawlerID ASC)',
              'trio',
            )
            .addSelect('ub.teamNumber', 'teamNumber')
            .addSelect('COUNT(*)', 'matchCount')
            .addSelect(
              'COUNT(CASE WHEN ub.gameResult = -1 THEN 1 ELSE NULL END)',
              'victoryCount',
            )
            .addSelect(
              'COUNT(CASE WHEN ub.gameResult = 1 THEN 1 ELSE NULL END)',
              'defeatCount',
            )
            .from(UserBattles, 'ub')
            .innerJoin(Maps, 'm', 'ub.mapID = m.mapID')
            .where('ub.modeCode = 3')
            .andWhere('ub.battleTime BETWEEN :begin AND :end', {
              begin: new Date(new Date(date).getTime() - 70 * 60 * 1000),
              end: new Date(new Date(date).getTime() - 10 * 60 * 1000),
            })
            .groupBy('ub.battleTime')
            .addGroupBy('ub.mapID')
            .addGroupBy('ub.matchType')
            .addGroupBy('ub.matchGrade')
            .addGroupBy('ub.teamNumber')
            .addGroupBy('m.mode');
        }, 'sq')
        .where('LENGTH(sq.trio) - LENGTH(REPLACE(sq.trio, ",", "")) + 1 = 3')
        .addGroupBy('sq.mapID')
        .addGroupBy('sq.matchType')
        .addGroupBy('sq.matchGrade')
        .addGroupBy('sq.teamNumber')
        .addGroupBy('sq.mode')
        .addGroupBy('sq.trio')
        .getRawMany()
        .then((result) => {
          return result?.map((item) => {
            const trio = [...new Set(item.trio.split(','))];
            item.brawlerID1 = trio[0];
            item.brawlerID2 = trio[1];
            item.brawlerID3 = trio[2];

            return {
              aggregationDate: item.aggregationDate,
              mapID: item.mapID,
              brawlerID1: item.brawlerID1,
              brawlerID2: item.brawlerID2,
              brawlerID3: item.brawlerID3,
              matchType: item.matchType,
              matchGrade: item.matchGrade,
              mode: item.mode,
              matchCount: item.matchCount,
              victoryCount: item.victoryCount,
              defeatCount: item.defeatCount,
            };
          });
        });

      battleTrios &&
        (await manager
          .createQueryBuilder()
          .insert()
          .into(BattleTrio)
          .values(battleTrios)
          .orIgnore()
          .execute());
    });
  }*/

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

  /** 이전 시즌 전투 기록 백업 */

  /*static backupBattles = async (season) => {
        await UserBattles.findAll({
            where: {
                MATCH_DT: {
                    [Op.lt]: season.SEASON_BGN_DT
                }
            },
            raw: true
        }).then(async (result) => {
            fs.writeFileSync(`./backup/battle-${Date.now()}.json`, JSON.stringify(result));
            await UserBattles.destroy({
                where: {
                    MATCH_DT: {
                        [Op.lt]: season.SEASON_BGN_DT
                    }
                }
            });
        });
    };*/

  @Cron('0 0-23/1 * * *')
  async updateBrawlers() {
    if (isMainThread) {
      const date = new Date();
      date.setSeconds(0);
      date.setMilliseconds(0);

      await this.insertBrawler();
      /*await this.updateBattleTrio(dateFormat);*/
      await this.updateBattleStats();
    }
  }
}
