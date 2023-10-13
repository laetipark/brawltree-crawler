import pm2 from 'pm2';
import cron from 'node-cron';

import sequelizeLoader from './loaders/sequelize.js';
import { Users } from './models/index.js';
import { col, fn, literal } from 'sequelize';

import { blossomService } from './services/blossom_service.js';
import { seasonService } from './services/season_service.js';
import { brawlerService } from './services/brawler_service.js';
import { battleService } from './services/battle_service.js';
import { rotationService } from './services/rotation_service.js';

import './middlewares/pm2_bus.js';

import config from './config/config.js';

async function main() {
  const processNumber = config.processNumber || 0;

  await sequelizeLoader();
  process.setMaxListeners(50);

  if (processNumber === 0) {
    let members = [];
    members = await blossomService.updateMembers();

    /*
    const clubs = await clubService.getClubList();
    for (const club of clubs) {
      const clubMembers = await clubService.getClubMembers(club);

      for (const user of clubMembers) {
          await Users.findOrCreate({
              where: {
                  USER_ID: user
              },
              defaults: {
                  USER_LST_BT: new Date(0),
              }
          });
      }
    }
    */

    const users = await Users.findAll({
      attributes: [[fn('REPLACE', col('USER_ID'), '#', ''), 'USER_ID']],
      order: [['UPDATED_AT', 'ASC']],
    }).then((result) => {
      return result.map((user) => user.USER_ID);
    });

    const userNumber = users.length;
    const chunkSize = userNumber / 2;

    pm2.connect((err) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }

      if (err) {
        console.error(err);
        pm2.disconnect();
        return;
      }

      process.send({
        type: `child:start`,
        data: {
          userList: [users.slice(0, chunkSize), users.slice(chunkSize)],
        },
      });

      pm2.disconnect();
    });

    await cron.schedule('5 0-59/10 * * * *', async () => {
      const cycle = await Users.findOne({
        attributes: [
          [
            fn('COUNT', literal('CASE WHEN CYCLE_NO = 1 THEN 1 ELSE NULL END')),
            'PROCESS_1',
          ],
          [
            fn('COUNT', literal('CASE WHEN CYCLE_NO = 2 THEN 1 ELSE NULL END')),
            'PROCESS_2',
          ],
        ],
        raw: true,
      });

      const emptyCycle = await Users.findAll({
        attributes: [[fn('REPLACE', col('USER_ID'), '#', ''), 'USER_ID']],
        where: {
          CYCLE_NO: null,
        },
      }).then((result) => {
        return result.map((item) => item.USER_ID);
      });

      process.send({
        type: `child:update`,
        data: {
          processNumber: cycle.PROCESS_1 < cycle.PROCESS_2 ? 1 : 2,
          userList: emptyCycle,
        },
      });
    });

    await cron.schedule('5 0-59/20 * * * *', async () => {
      await seasonService.insertSeason();
      await rotationService.insertRotation();
      await rotationService.updateRotation();
      await rotationService.deleteRotation();
    });

    await cron.schedule('5 * 0-23/1 * * *', async () => {
      await brawlerService.insertBrawler();
      await battleService.updateBattleTrio();
      await battleService.updateBrawlerStats();
    });

    await cron.schedule('0 0 * * *', async () => {
      members = await blossomService.updateMembers();
    });

    await cron.schedule('0-59/10 * * * *', async () => {
      await blossomService.updateMemberProfiles(members);
      const season = await seasonService.selectRecentSeason();
      await blossomService.updateMemberFriends(members, season);
      await blossomService.updateMemberRecords(members, season);
    });

    console.log('🌸 | Plant Brawl Scheduler NO.0');
  }
}

main().then(() => {
  console.log(`🌸 | Plant Brawl Tree Scheduler`);
});
