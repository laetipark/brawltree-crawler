import pm2 from 'pm2';
import path from 'path';
import { isMainThread, parentPort, Worker } from 'worker_threads';

import { usersRepository } from '~/database/database';
import { authService, workerService } from '../app.service';

import config from '~/configs/config';

// 메인 스레드 코드
if (isMainThread) {
  console.log(`🌸 | Plant Brawl Scheduler No.${config.processNumber || 0}`);
  const workers = [];

  pm2.launchBus(async (err, pm2Bus) => {
    pm2Bus.on(`child:start`, async ({ data }) => {
      const users = data.userList[config.processNumber - 1];

      const workerPromises = [];
      const chunkSize = Math.ceil(users.length / 20);

      for (let i = 0; i < 19; i++) {
        const workerPromise = new Promise((resolve) => {
          const worker = new Worker(path.join(__dirname, '../app'));
          workers.push(worker);
          const chunk = users.slice(chunkSize * i, chunkSize * (i + 1));

          worker.on('message', async (message) => {
            console.log(`🌸 | worker:create from worker: ${message}`);
            resolve(message);
          });

          worker.postMessage({
            eventName: 'worker:create',
            chunkNumber: i + 1,
            userList: chunk,
          });
        });

        workerPromises.push(workerPromise);
      }

      const results = await Promise.all(workerPromises);
      console.log('🌸 | All worker:create completed:', results);

      workerService.userIDs = users.slice(chunkSize * 19);
      await workerService.fetchUsers();
    });

    pm2Bus.on(`child:update`, async ({ data }) => {
      const workerPromises = [];

      if (config.processNumber === data.processNumber) {
        console.log('🌸 | update message: ', data.processNumber);

        for (const i in workers) {
          const workerPromise = new Promise((resolve) => {
            workers[i].on('message', async (message) => {
              console.log(`🌸 | worker:getUserNumber from worker: ${message}`);
              resolve(message);
            });

            workers[i].postMessage({
              eventName: 'worker:getUserNumber',
            });
          });

          workerPromises.push(workerPromise);
        }

        const results = await Promise.all(workerPromises);
        const userLengthList = results.map((item) => parseInt(item));
        const minLengthIndex = userLengthList.indexOf(
          Math.min(...userLengthList),
        );

        workers[minLengthIndex].postMessage({
          eventName: 'worker:insertUsers',
          userList: data.userList,
        });

        console.log(
          '🌸 | worker:getUserNumber completed:',
          userLengthList,
          `min index at worker${minLengthIndex + 1}`,
        );
        console.log(
          '🌸 | worker:insertUsers completed:',
          `inserted worker${minLengthIndex + 1}`,
          data.userList,
        );
      }
    });
  });
} else {
  // 워커 스레드 코드
  parentPort.on('message', async (message) => {
    if (message.eventName === 'worker:create') {
      workerService.userIDs = message.userList;

      await workerService.fetchUsers();
      parentPort.postMessage(`worker${message.chunkNumber} created!`);
    } else if (message.eventName === 'worker:getUserNumber') {
      parentPort.postMessage(workerService.userIDs.length);
    } else if (message.eventName === 'worker:insertUsers') {
      await Promise.all(
        message.userList.map(async (user) => {
          await usersRepository
            .createQueryBuilder('u')
            .update()
            .set({
              cycleNumber: config.processNumber,
            })
            .where('u.userID = :id', {
              id: `#${user}`,
            })
            .execute();

          await authService.manageUserRequests(user, true);
        }),
      );
    }
  });
}
