import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import path from 'path';
import { isMainThread, parentPort, Worker } from 'worker_threads';

import { WorkerService } from './worker.service';
import UserExportsService from '~/users/services/user-exports.service';

@Injectable()
export class WorkersService {
  private readonly workers: Worker[] = [];

  constructor(
    private readonly workerProcess: WorkerService,
    private readonly userExportsService: UserExportsService,
  ) {}

  /** worker thread 생성 및 작동 */
  async startCrawling() {
    if (isMainThread) {
      // main thread 메시지 이벤트
      const users = await this.userExportsService.getUserIDs();
      await this.userExportsService.updateUserCycle();

      const threadNumber = 5;
      const chunkSize = Math.ceil(users.length / threadNumber);
      const workerPromises = [];

      // workers threads promises 생성
      for (let i = 0; i < threadNumber; i++) {
        const workerPromise = new Promise((resolve) => {
          const worker = new Worker(path.join(__dirname, '../../main'));
          this.workers.push(worker);
          const chunk = users.slice(chunkSize * i, chunkSize * (i + 1));

          // worker thread로부터 메시지 확인
          worker.on('message', async (message) => {
            Logger.log(
              `🌸 | worker:create from worker: ${message}`,
              `Worker${i + 1}`,
            );
            resolve(message);
          });

          // Worker Thread에서 메시지 전송
          worker.postMessage({
            eventName: 'worker:create',
            chunkNumber: i + 1,
            userList: chunk,
          });
        });

        workerPromises.push(workerPromise);
      }

      const results = await Promise.all(workerPromises);
      Logger.log(`🌸 | All worker:create completed: ${results}`, 'Workers');
    } else {
      // worker thread 메시지 이벤트
      parentPort.on('message', async (message) => {
        // Worker 생성 이벤트
        if (message.eventName === 'worker:create') {
          await this.workerProcess.setUserIds(message.userList);

          await this.workerProcess.fetchWorkerUsers();
          parentPort.postMessage(`worker${message.chunkNumber} created!`);
        }
        // worker 사용자 데이터 개수 확인 이벤트
        else if (message.eventName === 'worker:getUserNumber') {
          parentPort.postMessage(
            (await this.workerProcess.getUserIds()).length,
          );
        }
        // Worker 사용자 추가 이벤트
        else if (message.eventName === 'worker:insertUsers') {
          await Promise.all(
            message.userList.map(async (user: string) => {
              await this.workerProcess.fetchUserBattles(user);
            }),
          );
        }
      });
    }
  }

  /** worker thread 중지 */
  async stopWorkers() {
    for (const worker of this.workers) {
      await worker.terminate(); // worker thread 중지
    }
  }

  @Cron('30 0 * * *') // 매일 00:30에 실행되도록 설정
  async restartWorkers() {
    if (isMainThread) {
      Logger.log('Stopping workers...', 'Workers');
      await this.stopWorkers(); // worker 중지

      // 일정 시간이 지난 후에 worker를 다시 시작하려면 setTimeout 등을 사용하여 구현할 수 있습니다.
      setTimeout(() => {
        Logger.log('Starting workers...', 'Workers');
        this.startCrawling(); // worker 재시작
      }, 60000);
    }
  }

  /** 사용자에 isCycle이 false인 데이터
   * 주기 설정 후 true로 변경 */
  @Cron('0-59/10 * * * *')
  async updateEmptyCycleUser() {
    if (isMainThread) {
      const emptyCycle = await this.userExportsService.getUserEmptyCycle();
      const workerPromises = [];

      for (const i in this.workers) {
        const workerPromise = new Promise((resolve) => {
          // worker thread로 사용자 데이터 개수 확인 메시지
          this.workers[i].on('message', async (message) => {
            Logger.log(
              `🌸 | worker:getUserNumber from worker: ${message}`,
              `Worker${Number(i) + 1}`,
            );
            resolve(message);
          });

          // worker thread로 사용자 데이터 개수 확인 메시지 전송
          this.workers[i].postMessage({
            eventName: 'worker:getUserNumber',
          });
        });

        workerPromises.push(workerPromise);
      }

      const results = await Promise.all(workerPromises);
      const workerUsersLength = results.map((item) => Number(item));
      const minUsersLengthIndex = workerUsersLength.indexOf(
        Math.min(...workerUsersLength),
      );

      // 할당 사용자가 적은 worker thread에 사용자 추가 데이터 및 메시지 전송
      this.workers[minUsersLengthIndex].postMessage({
        eventName: 'worker:insertUsers',
        userList: emptyCycle,
      });
      Logger.log(
        `🌸 | worker:getUserNumber completed: ${workerUsersLength} min index at worker${
          minUsersLengthIndex + 1
        }`,
        `Workers`,
      );
      Logger.log(
        `🌸 | worker:insertUsers completed: inserted worker${
          minUsersLengthIndex + 1
        } ${emptyCycle}`,
        `Worker${minUsersLengthIndex + 1}`,
      );
    }
  }
}
