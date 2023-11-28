import { Repository } from 'typeorm';
import { Seasons } from '~/seasons/entities/seasons.entity';
import { CreateSeasonsDto } from '~/seasons/dto/create-season.dto';
import { Cron } from '@nestjs/schedule';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isMainThread } from 'worker_threads';

@Injectable()
export default class SeasonsService {
  constructor(
    @InjectRepository(Seasons) private seasons: Repository<Seasons>,
  ) {}

  async updateSeason() {
    const recentSeason = await this.checkSeason();

    if (Date.now() > new Date(recentSeason.endDate).getTime()) {
      const id = recentSeason.id + 1;
      const beginDate = new Date(
        new Date(recentSeason.beginDate).setMonth(
          new Date(recentSeason.beginDate).getMonth() + 2,
        ),
      );
      const endDate = new Date(
        new Date(recentSeason.endDate).setMonth(
          new Date(recentSeason.endDate).getMonth() + 2,
        ),
      );
      const newDate = {
        beginDate: beginDate,
        endDate: endDate,
      };

      if (
        beginDate.getMonth() % 2 === 0 &&
        beginDate.getDate() + beginDate.getDay() < 12
      ) {
        newDate.beginDate = new Date(
          beginDate.setDate(
            beginDate.getDate() + ((8 % (beginDate.getDay() + 1)) + 1),
          ),
        );
      } else {
        newDate.beginDate = new Date(
          beginDate.setDate(
            beginDate.getDate() + (-5 - (8 % (beginDate.getDay() + 1)) + 1),
          ),
        );
      }

      if (
        endDate.getMonth() % 2 === 0 &&
        endDate.getDate() + endDate.getDay() < 12
      ) {
        newDate.endDate = new Date(
          endDate.setDate(
            endDate.getDate() + ((8 % (endDate.getDay() + 1)) + 1),
          ),
        );
      } else {
        newDate.endDate = new Date(
          endDate.setDate(
            endDate.getDate() + (-5 - (8 % (endDate.getDay() + 1)) + 1),
          ),
        );
      }

      const seasonData: CreateSeasonsDto = {
        seasonNumber: id,
        beginDate: newDate.beginDate,
        endDate: newDate.endDate,
      };

      const season = this.seasons.create(seasonData);
      await this.seasons.save(season);

      if (Date.now() > newDate.endDate.getTime()) {
        await this.updateSeason();
      }
    }
  }

  /** 최근 시즌 불러오기 */
  async selectRecentSeason(): Promise<Seasons> {
    return await this.seasons
      .find({
        take: 1,
        order: {
          id: 'DESC',
        },
      })
      .then((result) => result[0]);
  }

  @Cron('5 0-59/20 * * * *')
  async seasonService() {
    isMainThread && (await this.updateSeason());
  }

  private async checkSeason(): Promise<Seasons> {
    return this.seasons
      .createQueryBuilder('s')
      .select('s.seasonNumber', 'seasonNumber')
      .addSelect('s.beginDate', 'beginDate')
      .addSelect('s.endDate', 'endDate')
      .orderBy('beginDate', 'DESC')
      .getRawOne()
      .then(async (result) => {
        if (result === null) {
          const seasonData: CreateSeasonsDto = {
            seasonNumber: 10,
            beginDate: new Date('2022-01-03T18:00:00'),
            endDate: new Date('2022-03-07T17:50:00'),
          };

          const season = this.seasons.create(seasonData);
          return await this.seasons.save(season);
        } else {
          return result;
        }
      });
  }
}
