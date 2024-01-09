import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import AppConfigService from '~/utils/services/app-config.service';
import DateService from '~/utils/services/date.service';

import { Events } from '~/maps/entities/events.entity';
import { Maps } from '~/maps/entities/maps.entity';
import { MapRotation } from '~/maps/entities/map-rotation.entity';
import { CreateMapDto } from '~/maps/dto/create-map.dto';

@Injectable()
export default class MapsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Events)
    private readonly events: Repository<Events>,
    @InjectRepository(Maps)
    private readonly maps: Repository<Maps>,
    @InjectRepository(MapRotation)
    private readonly mapRotation: Repository<MapRotation>,
    private readonly dateService: DateService,
    private readonly configService: AppConfigService,
    private readonly httpService: HttpService,
  ) {}

  async updateRotation() {
    await this.dataSource.transaction(async (manager) => {
      const eventsRepository = manager.withRepository(this.events);
      const mapRotationRepository = manager.withRepository(this.mapRotation);

      const trophyLeagueMaps = await eventsRepository
        .createQueryBuilder('event')
        .select('event.mapID', 'mapID')
        .where('event.id not IN (20, 21, 22, 23, 24, 25, 26)')
        .getRawMany()
        .then((result) => {
          return result.map((map) => {
            return {
              mapID: map.mapID,
              isTrophyLeague: true,
            };
          });
        });

      const powerLeagueMaps = (await this.getRotationPL())
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
        .createQueryBuilder()
        .update()
        .set({
          isTrophyLeague: false,
        })
        .where('mapID NOT IN (:maps)', {
          maps: trophyLeagueMaps.map((map) => map.mapID),
        })
        .execute();

      await mapRotationRepository
        .createQueryBuilder()
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

      maps.map((item: any) => {
        const mapID = item.event.id;
        const mapMode = item.event.mode;
        const mapName = item.event.map;

        const beginTime = new Date(this.dateService.getDate(item.startTime));
        const endTime = new Date(this.dateService.getDate(item.endTime));
        const modifiers = item.event.modifiers?.at(0);

        const slotID = item.slotId;

        this.maps.upsert(
          {
            id: mapID,
            mode: mapMode,
            name: mapName,
          },
          ['id'],
        );

        this.events.upsert(
          {
            id: slotID,
            startTime: beginTime,
            endTime: endTime,
            mapID: mapID,
            modifiers: modifiers,
          },
          ['mapID'],
        );
      });
    } catch (error) {
      Logger.error(error.response?.data, error.response?.status);

      throw 'An error happened!';
    }
  }

  async deleteRotation() {
    const events = (
      await firstValueFrom(
        this.httpService
          .get('/database/trophy_league.json', {
            baseURL: this.configService.getCdnUrl(),
          })
          .pipe(),
      )
    ).data.type;

    await this.events
      .createQueryBuilder()
      .delete()
      .where(
        'endTime < DATE_FORMAT(DATE_SUB(NOW(), INTERVAL :hour HOUR), "%Y-%m-%d-%H") AND id IN (:ids)',
        {
          ids: events.ids,
          hour: events.hour,
        },
      )
      .orWhere(
        'endTime < DATE_FORMAT(DATE_SUB(NOW(), INTERVAL :hour HOUR), "%Y-%m-%d-%H") AND id IN (:ids)',
        {
          ids: events.ids,
          hour: events.hour,
        },
      )
      .orWhere(
        'endTime < DATE_FORMAT(DATE_SUB(NOW(), INTERVAL :hour HOUR), "%Y-%m-%d-%H") AND id IN (:ids)',
        {
          ids: events.ids,
          hour: events.hour,
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

  private async getRotationPL() {
    try {
      const response = await firstValueFrom(
        this.httpService
          .get('/database/power_league.json', {
            baseURL: this.configService.getCdnUrl(),
          })
          .pipe(),
      );
      return response.data;
    } catch (error) {
      Logger.error(error, 'getRotationPL');
    }
  }
}
