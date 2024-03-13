import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { DataSource, Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { UtilConfigService } from '~/utils/config/services/util-config.service';
import { DateService } from '~/utils/config/services/date.service';

import { Events } from '~/maps/entities/events.entity';
import { Maps } from '~/maps/entities/maps.entity';
import { MapRotation } from '~/maps/entities/map-rotation.entity';
import { CreateMapDto } from '~/maps/dto/create-map.dto';

@Injectable()
export default class MapsService {
  private addMaps: CreateMapDto[] = [];

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Events)
    private readonly events: Repository<Events>,
    @InjectRepository(Maps)
    private readonly maps: Repository<Maps>,
    @InjectRepository(MapRotation)
    private readonly mapRotation: Repository<MapRotation>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly dateService: DateService,
    private readonly configService: UtilConfigService,
    private readonly httpService: HttpService,
  ) {}

  async updateRotation() {
    await this.dataSource.transaction(async (manager) => {
      const eventsRepository = manager.withRepository(this.events);
      const mapRotationRepository = manager.withRepository(this.mapRotation);

      const trophyLeagueMaps = await eventsRepository
        .createQueryBuilder('e')
        .select('e.mapID', 'mapID')
        .where('e.id not IN (20, 21, 22, 23, 24, 25, 26)')
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

      maps.map(async (item: any) => {
        const mapID = item.event.id;
        const mapMode = item.event.mode;
        const mapName = item.event.map;

        const beginTime = new Date(this.dateService.getDate(item.startTime));
        const endTime = new Date(this.dateService.getDate(item.endTime));
        const modifiers = item.event.modifiers?.at(0);

        const slotID = item.slotId;

        await this.maps.upsert(
          {
            id: mapID,
            mode: mapMode,
            name: mapName,
          },
          ['id'],
        );

        await this.events.upsert(
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
        this.httpService.get('/database/trophy_league.json', {
          baseURL: this.configService.getCdnUrl(),
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      )
    ).data.type;

    await this.events
      .createQueryBuilder()
      .delete()
      .where(
        'endTime < DATE_FORMAT(DATE_SUB(NOW(), INTERVAL :hour1 HOUR), "%Y-%m-%d-%H") AND id IN (:ids1)',
        {
          ids1: events.fixed01.ids.length !== 0 ? events.fixed01.ids : '',
          hour1: events.fixed01.hour,
        },
      )
      .orWhere(
        'endTime < DATE_FORMAT(DATE_SUB(NOW(), INTERVAL :hour2 HOUR), "%Y-%m-%d-%H") AND id IN (:ids2)',
        {
          ids2: events.fixed02.ids.length !== 0 ? events.fixed02.ids : '',
          hour2: events.fixed02.hour,
        },
      )
      .orWhere(
        'endTime < DATE_FORMAT(DATE_SUB(NOW(), INTERVAL :hour3 HOUR), "%Y-%m-%d-%H") AND id IN (:ids3)',
        {
          ids3: events.rotated.ids.length !== 0 ? events.rotated.ids : '',
          hour3: events.rotated.hour,
        },
      )
      .orWhere(
        'endTime < DATE_FORMAT(NOW(), "%Y-%m-%d-%H") AND id BETWEEN 20 AND 26',
      )
      .execute();
  }

  async upsertMaps() {
    const maps = await this.cacheManager.get<CreateMapDto[]>('maps');
    const mapList = await this.cacheManager.get<CreateMapDto[]>('addMaps');

    if (mapList) {
      if (maps) {
        await this.cacheManager.set(
          'maps',
          maps.concat(
            mapList.filter(
              (item2) => !maps.some((item1) => item1.id === String(item2.id)),
            ),
          ),
        );
      } else {
        await this.cacheManager.set('maps', mapList);
      }

      await this.maps.upsert(mapList, ['id']);
      await this.cacheManager.del('addMaps');
    }
  }

  async setMaps(createMapDtos: CreateMapDto[]) {
    const maps = await this.cacheManager.get<CreateMapDto[]>('maps');
    const mapList = await this.cacheManager.get<CreateMapDto[]>('addMaps');

    if (maps) {
      if (mapList) {
        await this.cacheManager.set(
          'addMaps',
          mapList.concat(
            createMapDtos.filter((item2) => {
              return (
                !mapList.some((item1) => item1.id === item2.id) &&
                !maps.some((item1) => item1.id === String(item2.id))
              );
            }),
          ),
        );
      } else {
        const addMaps = createMapDtos.concat(
          createMapDtos.filter(
            (item2) => !maps.some((item1) => item1.id === String(item2.id)),
          ),
        );

        addMaps && (await this.cacheManager.set('addMaps', addMaps));
      }
    }
  }

  async updateMaps() {
    const maps = await this.maps.find();
    await this.cacheManager.set('maps', maps);
  }

  private async getRotationPL() {
    try {
      const response = await firstValueFrom(
        this.httpService.get('/database/power_league.json', {
          baseURL: this.configService.getCdnUrl(),
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );
      return response.data;
    } catch (error) {
      Logger.error(error, 'getRotationPL');
    }
  }
}
