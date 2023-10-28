import { Injectable, Logger } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Users } from '~/users/entities/users.entity';
import { isMainThread, parentPort, Worker } from 'worker_threads';
import path from 'path';
import { WorkerProcess } from './worker.process';
import UserBattlesService from '~/users/services/user-battles.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class WorkerService {
  private readonly workers: Worker[] = [];

  constructor(
    @InjectRepository(Users) private users: Repository<Users>,
    private userBattlesService: UserBattlesService,
    private workerProcess: WorkerProcess,
  ) {}

  async startCrawling() {
    if (isMainThread) {
      const users = await this.users
        .createQueryBuilder('u')
        .select('REPLACE(u.userID, "#", "")', 'userID')
        .orderBy('u.lastBattleAt', 'ASC')
        .getRawMany()
        .then((result) => {
          return result.map((user) => user.userID);
        });

      await this.users
        .createQueryBuilder()
        .update()
        .set({
          isCycle: true,
        })
        .execute();

      const chunkSize = Math.ceil(users.length / 5);
      const workerPromises = [];

      for (let i = 0; i < 4; i++) {
        const workerPromise = new Promise((resolve) => {
          const worker = new Worker(path.join(__dirname, '../main'));
          this.workers.push(worker);
          const chunk = users.slice(chunkSize * i, chunkSize * (i + 1));

          worker.on('message', async (message) => {
            Logger.log(`🌸 | worker:create from worker: ${message}`);
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
      Logger.log('🌸 | All worker:create completed:', results);

      await this.workerProcess.setUserIds(users.slice(chunkSize * 4));
      await this.workerProcess.fetchUsers();
    } else {
      // 워커 스레드 코드
      parentPort.on('message', async (message) => {
        if (message.eventName === 'worker:create') {
          await this.workerProcess.setUserIds(message.userList);

          await this.workerProcess.fetchUsers();
          parentPort.postMessage(`worker${message.chunkNumber} created!`);
        } else if (message.eventName === 'worker:getUserNumber') {
          parentPort.postMessage(
            (await this.workerProcess.getUserIds()).length,
          );
        } else if (message.eventName === 'worker:insertUsers') {
          await Promise.all(
            message.userList.map(async (user) => {
              await this.userBattlesService.manageUserRequests(user, true);
            }),
          );
        }
      });
    }
  }

  @Cron('0-59/10 * * * *')
  async insertEmptyCycleUser() {
    if (isMainThread) {
      const emptyCycle = await this.users
        .createQueryBuilder('u')
        .select('REPLACE(u.userID, "#", "")', 'userID')
        .where('u.isCycle = FALSE')
        .getRawMany()
        .then((result) => {
          return result.map((item) => item.userID);
        });

      const workerPromises = [];

      for (const i in this.workers) {
        const workerPromise = new Promise((resolve) => {
          this.workers[i].on('message', async (message) => {
            Logger.log(`🌸 | worker:getUserNumber from worker: ${message}`);
            resolve(message);
          });

          this.workers[i].postMessage({
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

      this.workers[minLengthIndex].postMessage({
        eventName: 'worker:insertUsers',
        userList: emptyCycle,
      });

      Logger.log(
        `🌸 | worker:getUserNumber completed: ${userLengthList} min index at worker${
          minLengthIndex + 1
        }`,
      );
      Logger.log(
        `🌸 | worker:insertUsers completed: inserted worker${
          minLengthIndex + 1
        } ${emptyCycle}`,
      );
    }
  }
}
