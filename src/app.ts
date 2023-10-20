import pm2 from 'pm2';
import cron from 'node-cron';

import initialize, { usersRepository } from './database/database';
import {
  battleService,
  blossomService,
  brawlerService,
  dateService,
  eventsService,
  seasonService,
} from './app.service';
import './middlewares/pm2_bus';

import config from './configs/config';

async function app() {
  await initialize();
  process.setMaxListeners(50);

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

  const users = await usersRepository
    .createQueryBuilder('u')
    .select('REPLACE(u.userID, "#", "")', 'userID')
    .orderBy('u.updatedAt', 'ASC')
    .getRawMany()
    .then((result) => {
      return result.map((user) => user.userID);
    });

  const userNumber = users.length;
  const chunkSize = userNumber / 2;

  if (process.env.NODE_ENV !== 'development') {
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

    cron.schedule('5 0-59/10 * * * *', async () => {
      const cycle = await usersRepository
        .createQueryBuilder('u')
        .select(
          'COUNT(CASE WHEN u.cycleNumber = 1 THEN 1 ELSE NULL END)',
          'process1',
        )
        .addSelect(
          'COUNT(CASE WHEN u.cycleNumber = 2 THEN 1 ELSE NULL END)',
          'process2',
        )
        .getRawOne();

      const emptyCycle = await usersRepository
        .createQueryBuilder('u')
        .select('REPLACE(u.userID, "#", "")', 'userID')
        .where('u.cycleNumber = NULL')
        .getRawMany()
        .then((result) => {
          return result.map((item) => item.userID);
        });

      process.send({
        type: `child:update`,
        data: {
          processNumber: cycle.process1 < cycle.process2 ? 1 : 2,
          userList: emptyCycle,
        },
      });
    });
  }

  cron.schedule('5 0-59/20 * * * *', async () => {
    await seasonService.updateSeason();
    await eventsService.insertRotation();
    await eventsService.updateRotation();
    await eventsService.deleteRotation();
  });

  cron.schedule('5 * 0-23/1 * * *', async () => {
    const date = new Date();
    date.setSeconds(0);
    date.setMilliseconds(0);
    const dateFormat = dateService.getDateFormat(date);

    await brawlerService.insertBrawler();
    await battleService.updateBattleTrio(dateFormat);
    await battleService.updateBrawlerStats(dateFormat);
  });

  cron.schedule('0 0 * * *', async () => {
    members = await blossomService.updateMembers();
  });

  cron.schedule('0-59/10 * * * *', async () => {
    const date = new Date();
    date.setSeconds(0);
    date.setMilliseconds(0);
    const dateFormat = dateService.getDateFormat(date);

    await blossomService.updateMemberProfiles(members);
    await blossomService.updateMemberFriends(members, dateFormat);
    await blossomService.updateMemberRecords(members, dateFormat);
  });

  console.log('🌸 | Plant Brawl Scheduler NO.0');
}

const processNumber = config.processNumber || 0;
if (processNumber === 0) {
  app().then(() => {
    console.log(`🌸 | Plant Brawl Tree`);
  });
}
