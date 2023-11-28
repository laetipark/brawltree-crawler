import { DataSource, Repository } from 'typeorm';

import { Events } from '~/maps/entities/events.entity';
import { Maps } from '~/maps/entities/maps.entity';

import DateService from '~/utils/services/date.service';
import rotationPL from '~/public/json/power_league.json';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Cron } from '@nestjs/schedule';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isMainThread } from 'worker_threads';
import { MapRotation } from '~/maps/entities/map-rotation.entity';
import { CreateMapDto } from '~/maps/dto/create-map.dto';

@Injectable()
export default class MapsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Events)
    private events: Repository<Events>,
    @InjectRepository(Maps)
    private maps: Repository<Maps>,
    @InjectRepository(MapRotation)
    private mapRotation: Repository<MapRotation>,
    private dateService: DateService,
    private readonly httpService: HttpService,
  ) {
    this.insertRotation().then(() => {});
  }

  async updateRotation() {
    await this.dataSource.transaction(async (manager) => {
      const eventsRepository = manager.withRepository(this.events);
      const mapRotationRepository = manager.withRepository(this.mapRotation);

      const trophyLeagueMaps = await eventsRepository
        .createQueryBuilder('e')
        .select('e.mapID', 'mapID')
        .where('e.id IN (1, 2, 3, 4, 5, 6, 33)')
        .getRawMany()
        .then((result) => {
          return result.map((map) => {
            return {
              mapID: map.mapID,
              isTrophyLeague: true,
            };
          });
        });

      const powerLeagueMaps = rotationPL
        .filter((item) => typeof item === 'object' && 'mapID' in item)
        .map((item: { mapID: string }) => {
          return {
            mapID: item.mapID,
            isPowerLeague: true,
          };
        });

      const allData = [...trophyLeagueMaps, ...powerLeagueMaps];

      // 키를 기반으로 객체를 합칠 함수
      const mergeByProperty = (array: any[], property: string) =>
        array.reduce((acc, obj) => {
          const key = obj[property];
          if (!acc[key]) {
            acc[key] = obj;
          } else {
            // 같은 키를 가진 객체를 합침
            acc[key] = { ...acc[key], ...obj };
          }
          return acc;
        }, {});

      // mapID를 기반으로 객체를 합침
      const mergedData = Object.values(mergeByProperty(allData, 'mapID'));

      await mapRotationRepository.upsert(mergedData, ['mapID']);

      await mapRotationRepository
        .createQueryBuilder('mr')
        .update()
        .set({
          isTrophyLeague: false,
        })
        .where('mapID NOT IN (:maps)', {
          maps: trophyLeagueMaps.map((map) => map.mapID),
        })
        .execute();

      await mapRotationRepository
        .createQueryBuilder('mr')
        .update()
        .set({
          isPowerLeague: false,
        })
        .where('mapID NOT IN (:maps)', {
          maps: powerLeagueMaps.map((map) => map.mapID),
        })
        .execute();

      await mapRotationRepository.delete({
        isTrophyLeague: false,
        isPowerLeague: false,
      });
    });
  }

  async insertRotation() {
    try {
      const responseEvent = await firstValueFrom(
        this.httpService.get('/events/rotation').pipe(),
      );

      const maps = responseEvent.data;
      maps &&
        (await this.dataSource.transaction(async (manager) => {
          const eventsRepository = manager.withRepository(this.events);
          const mapsRepository = manager.withRepository(this.maps);

          for (const item of maps) {
            const mapID = item.event.id;
            const mapMode = item.event.mode;
            const mapName = item.event.map;

            const beginTime = new Date(
              this.dateService.getDate(item.startTime),
            );
            const endTime = new Date(this.dateService.getDate(item.endTime));
            const modifiers = item.event.modifiers?.at(0);

            const slotID = item.slotId;

            await mapsRepository.upsert(
              {
                id: mapID,
                mode: mapMode,
                name: mapName,
              },
              ['id'],
            );

            await eventsRepository.upsert(
              {
                id: slotID,
                startTime: beginTime,
                endTime: endTime,
                mapID: mapID,
                modifiers: modifiers,
              },
              ['mapID'],
            );
          }
        }));
    } catch (error) {
      Logger.error(error.response?.data, error.response?.status);

      throw 'An error happened!';
    }
  }

  async deleteRotation() {
    await this.events
      .createQueryBuilder()
      .delete()
      .where(
        'endTime < DATE_FORMAT(DATE_SUB(NOW(), INTERVAL :date HOUR), "%Y-%m-%d-%H") AND id IN (4, 6, 33)',
        {
          date: 360,
        },
      )
      .orWhere(
        'endTime < DATE_FORMAT(DATE_SUB(NOW(), INTERVAL :date HOUR), "%Y-%m-%d-%H") AND id NOT IN (4, 6, 33)',
        {
          date: 168,
        },
      )
      .orWhere(
        'endTime < DATE_FORMAT(DATE_SUB(NOW(), INTERVAL :date HOUR), "%Y-%m-%d-%H") AND id = 8',
        {
          date: 144,
        },
      )
      .orWhere(
        'endTime < DATE_FORMAT(NOW(), "%Y-%m-%d-%H") AND id BETWEEN 20 AND 26',
      )
      .execute();
  }

  async insertMaps(maps: CreateMapDto[]) {
    try {
      await this.maps.upsert(maps, ['id']);
    } catch (error) {
      Logger.error(error);
    }
  }

  @Cron('0 1 * * * *')
  async mapsService() {
    if (isMainThread) {
      await this.insertRotation();
      await this.updateRotation();
      await this.deleteRotation();
    }
  }
}
