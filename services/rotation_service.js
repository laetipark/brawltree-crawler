import axios from 'axios';
import { fn, literal, Op } from 'sequelize';
import { Maps, MapRotation, Events } from '../models/index.js';
import { dateService } from './date_service.js';

import rotationPL from '../public/json/power_league.json' assert { type: 'json' };
import config from '../config/config.js';

export class rotationService {
  static updateRotation = async () => {
    const trophyLeagueMaps = await Events.findAll({
      attributes: ['MAP_ID'],
      where: {
        ROTATION_SLT_NO: {
          [Op.in]: [1, 2, 3, 4, 5, 6, 33],
        },
      },
    }).then((result) => {
      return result.map((map) => map.MAP_ID);
    });

    const powerLeagueMaps = rotationPL
      .filter((item) => item.MAP_ID !== undefined)
      .map((item) => item.MAP_ID);

    trophyLeagueMaps.map(async (map) => {
      await MapRotation.upsert({
        MAP_ID: map,
        ROTATION_TL_BOOL: true,
      });
    });

    powerLeagueMaps.map(async (map) => {
      await MapRotation.upsert({
        MAP_ID: map,
        ROTATION_PL_BOOL: true,
      });
    });

    await MapRotation.update(
      {
        ROTATION_TL_BOOL: false,
      },
      {
        where: {
          MAP_ID: {
            [Op.notIn]: trophyLeagueMaps,
          },
        },
      },
    );

    await MapRotation.update(
      {
        ROTATION_PL_BOOL: false,
      },
      {
        where: {
          MAP_ID: {
            [Op.notIn]: powerLeagueMaps,
          },
        },
      },
    );

    await MapRotation.destroy({
      where: {
        ROTATION_TL_BOOL: false,
        ROTATION_PL_BOOL: false,
      },
    });
  };

  static insertRotation = async () => {
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

      const beginTime = new Date(dateService.getDate(item.startTime));
      const endTime = new Date(dateService.getDate(item.endTime));
      const modifiers = item.event.modifiers?.at(0);

      const slotID = item.slotId;

      await Maps.findOrCreate({
        where: {
          MAP_ID: mapID,
        },
        defaults: {
          MAP_MD: mapMode,
          MAP_NM: mapName,
        },
      });

      await Events.upsert({
        ROTATION_SLT_NO: slotID,
        ROTATION_BGN_DT: beginTime,
        ROTATION_END_DT: endTime,
        MAP_ID: mapID,
        MAP_MDFS: modifiers,
      });
    }
  };

  static deleteRotation = async () => {
    await Events.destroy({
      where: {
        [Op.or]: [
          {
            ROTATION_END_DT: {
              [Op.lt]: fn(
                'DATE_FORMAT',
                fn('DATE_SUB', fn('NOW'), literal('INTERVAL 360 HOUR')),
                '%Y-%m-%d-%H',
              ),
            },
            ROTATION_SLT_NO: {
              [Op.or]: [4, 6, 33],
            },
          },
          {
            ROTATION_END_DT: {
              [Op.lt]: fn(
                'DATE_FORMAT',
                fn('DATE_SUB', fn('NOW'), literal('INTERVAL 168 HOUR')),
                '%Y-%m-%d-%H',
              ),
            },
            ROTATION_SLT_NO: {
              [Op.notIn]: [4, 6, 33],
            },
          },
          {
            ROTATION_END_DT: {
              [Op.lt]: fn(
                'DATE_FORMAT',
                fn('DATE_SUB', fn('NOW'), literal('INTERVAL 144 HOUR')),
                '%Y-%m-%d-%H',
              ),
            },
            ROTATION_SLT_NO: 8,
          },
          {
            ROTATION_END_DT: {
              [Op.lt]: fn('DATE_FORMAT', fn('NOW'), '%Y-%m-%d-%H'),
            },
            ROTATION_SLT_NO: {
              [Op.between]: [20, 26],
            },
          },
        ],
      },
    });
  };
}
