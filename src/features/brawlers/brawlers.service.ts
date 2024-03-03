import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom, map } from 'rxjs';

import {
  BrawlerItems,
  Brawlers,
  BrawlerSkills,
} from './entities/brawlers.entity';
import { BattleStats } from '~/brawlers/entities/battle-stats.entity';
import { UserBattles } from '~/users/entities/user-battles.entity';
import { Maps } from '~/maps/entities/maps.entity';
import { CreateBrawlerDto } from '~/brawlers/dto/create-brawler.dto';
import { CreateBrawlerItemDto } from '~/brawlers/dto/create-brawler-item.dto';
import { BrawlerItemType, BrawlerType } from '~/common/types/brawler.type';
import { UtilConfigService } from '~/utils/config/services/util-config.service';
import { CreateBrawlerSkillDto } from '~/brawlers/dto/create-brawler-skill.dto';

@Injectable()
export default class BrawlersService {
  constructor(
    @InjectRepository(Brawlers)
    private readonly brawlers: Repository<Brawlers>,
    @InjectRepository(BattleStats)
    private readonly battleStats: Repository<BattleStats>,
    @InjectRepository(BrawlerItems)
    private readonly brawlerItems: Repository<BrawlerItems>,
    @InjectRepository(BrawlerSkills)
    private readonly brawlerSkills: Repository<BrawlerSkills>,
    @InjectRepository(UserBattles)
    private readonly userBattles: Repository<UserBattles>,
    private readonly configService: UtilConfigService,
    private readonly httpService: HttpService,
  ) {}

  /** 브롤러 정보 추가 */
  async insertBrawler() {
    const brawlers: CreateBrawlerDto[] = [];
    const brawlerItems: CreateBrawlerItemDto[] = [];
    const brawlerSkills: CreateBrawlerSkillDto[] = [];
    const brawlersResponse = await this.getBrawlers();
    const brawlerItemsResponse = await this.getBrawlerItems();

    await firstValueFrom(
      this.httpService.get('/brawlers').pipe(
        map((res) => {
          res.data.items.map((brawler: BrawlerType) => {
            const brawlerData = brawlersResponse.find(
              (item) => item?.id === brawler.id,
            );

            brawlers.push({
              id: brawler.id,
              name: brawler.name,
              rarity: brawlerData?.rarity || null,
              role: brawlerData?.role || null,
              gender: brawlerData?.gender || null,
              icon: brawlerData?.icon || null,
            });

            brawlerSkills.push({
              brawlerID: brawler.id,
              values: brawlerData?.skill || null,
            });

            brawler.starPowers.map((starPower: BrawlerItemType) => {
              brawlerItems.push({
                id: starPower.id,
                brawlerID: brawler.id,
                kind: 'starPower',
                name: starPower.name,
                values:
                  brawlerItemsResponse.find((item) => item.id === starPower.id)
                    ?.values || null,
              });
            });

            brawler.gadgets.map((gadget: BrawlerItemType) => {
              brawlerItems.push({
                id: gadget.id,
                brawlerID: brawler.id,
                kind: 'gadget',
                name: gadget.name,
                values:
                  brawlerItemsResponse.find((item) => item.id === gadget.id)
                    ?.values || null,
              });
            });
          });
        }),
      ),
    );

    await this.brawlers.upsert(brawlers, ['id']);
    await this.brawlerSkills.upsert(brawlerSkills, ['brawlerID']);
    await this.brawlerItems.upsert(brawlerItems, ['id', 'brawlerID']);
  }

  /** 전투 통계 갱신 */
  async updateBattleStats() {
    const battleStats = await this.userBattles
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

    await this.battleStats.upsert(battleStats, [
      'mapID',
      'brawlerID',
      'matchType',
      'matchGrade',
    ]);
  }

  async updateSeason() {
    await this.battleStats.delete({});
  }

  async getBrawlerItems() {
    try {
      const response = await firstValueFrom(
        this.httpService.get('/database/brawler_items.json', {
          baseURL: this.configService.getCdnUrl(),
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );
      return response.data;
    } catch (error) {
      Logger.error(error, 'getBrawlerItems');
    }
  }

  private async getBrawlers() {
    try {
      const response = await firstValueFrom(
        this.httpService.get('/database/brawlers.json', {
          baseURL: this.configService.getCdnUrl(),
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );
      return response.data;
    } catch (error) {
      Logger.error(error, 'getBrawlers');
    }
  }
}
