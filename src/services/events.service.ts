import axios from 'axios';
import { Repository } from 'typeorm';

import { Events } from '~/entities/events.entity';
import { MapRotation, Maps } from '~/entities/maps.entity';

import DateService from '~/services/date.service';

import rotationPL from '../public/json/power_league.json';
import config from '~/configs/config';

export default class EventsService {
  constructor(
    private events: Repository<Events>,
    private maps: Repository<Maps>,
    private mapRotation: Repository<MapRotation>,
    private dateService: DateService,
  ) {}

  async updateRotation() {
    const trophyLeagueMaps = await this.events
      .createQueryBuilder('e')
      .select('e.mapID', 'mapID')
      .where('e.slotNumber IN (1, 2, 3, 4, 5, 6, 33)')
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
    function mergeByProperty(array, property) {
      return array.reduce((acc, obj) => {
        const key = obj[property];
        if (!acc[key]) {
          acc[key] = obj;
        } else {
          // 같은 키를 가진 객체를 합침
          acc[key] = { ...acc[key], ...obj };
        }
        return acc;
      }, {});
    }

    // mapID를 기반으로 객체를 합침
    const mergedData = Object.values(mergeByProperty(allData, 'mapID'));

    await this.mapRotation.upsert(mergedData, ['mapID']);

    await this.mapRotation
      .createQueryBuilder('mr')
      .update()
      .set({
        isTrophyLeague: false,
      })
      .where('mapID NOT IN (:maps)', {
        maps: trophyLeagueMaps.map((map) => map.mapID),
      })
      .execute();

    await this.mapRotation
      .createQueryBuilder('mr')
      .update()
      .set({
        isPowerLeague: false,
      })
      .where('mapID NOT IN (:maps)', {
        maps: powerLeagueMaps.map((map) => map.mapID),
      })
      .execute();

    await this.mapRotation.delete({
      isTrophyLeague: false,
      isPowerLeague: false,
    });
  }

  async insertRotation() {
    const responseEvent = await axios({
      url: `${config.url}/events/rotation`,
      method: 'GET',
      headers: config.headers,
    })
      .then((res) => {
        return res.data;
      })
      .catch((err) => console.error(err));

    for (const item of responseEvent) {
      const mapID = item.event.id;
      const mapMode = item.event.mode;
      const mapName = item.event.map;

      const beginTime = new Date(this.dateService.getDate(item.startTime));
      const endTime = new Date(this.dateService.getDate(item.endTime));
      const modifiers = item.event.modifiers?.at(0);

      const slotID = item.slotId;

      await this.maps.upsert(
        {
          mapID: mapID,
          mode: mapMode,
          name: mapName,
        },
        ['mapID'],
      );

      await this.events.upsert(
        {
          mapID: mapID,
          slotNumber: slotID,
          beginDate: beginTime,
          endDate: endTime,
          modifiers: modifiers,
        },
        ['mapID'],
      );
    }
  }

  async deleteRotation() {
    await this.events
      .createQueryBuilder()
      .delete()
      .where(
        'endDate < DATE_FORMAT(DATE_SUB(NOW(), INTERVAL :date HOUR), "%Y-%m-%d-%H") AND slotNumber IN (4, 6, 33)',
        {
          date: 360,
        },
      )
      .orWhere(
        'endDate < DATE_FORMAT(DATE_SUB(NOW(), INTERVAL :date HOUR), "%Y-%m-%d-%H") AND slotNumber NOT IN (4, 6, 33)',
        {
          date: 168,
        },
      )
      .orWhere(
        'endDate < DATE_FORMAT(DATE_SUB(NOW(), INTERVAL :date HOUR), "%Y-%m-%d-%H") AND slotNumber = 8',
        {
          date: 144,
        },
      )
      .orWhere(
        'endDate < DATE_FORMAT(NOW(), "%Y-%m-%d-%H") AND slotNumber BETWEEN 20 AND 26',
      )
      .execute();
  }
}
