import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { firstValueFrom } from 'rxjs';
import UserExportsService from '~/users/services/user-exports.service';

@Injectable()
export default class WorkerService {
  constructor(private readonly userExportsService: UserExportsService) {
    this.startCrawling().then(() => {
      Logger.log('crawling', 'StartCrawling');
    });
  }

  /** Worker 사용자에 대한 전투 기록 변경 순환 */
  async startCrawling() {
    const users = await this.userExportsService.getUserIDs();
    await this.updateUsers(users);
  }

  async updateUser(userID: string, errorStack: number) {
    try {
      const response = this.userExportsService.fetchUserBattleResponse(userID);

      const user = await this.userExportsService.fetchUserResponse(userID);
      await this.userExportsService.updateUserIsCycle(userID);
      await this.userExportsService.updateUserProfile(user);
      const battleLogs = (await firstValueFrom(response.request)).data;

      // 사용자 전투 기록 추가
      await this.userExportsService.updateUserBattlesByResponse(
        battleLogs,
        response.id,
      );
      await this.sleep(2000);
    } catch (error) {
      Logger.error(error, 'Worker');
      if (errorStack > 0) {
        this.userExportsService.deleteUser(userID);
      } else {
        // 10(60)분 후에 fetchUserBattles 실행
        setTimeout(
          () => {
            this.updateUser(userID, errorStack + 1);
          },
          10 * 60 * 1000,
        );
      }
    }
  }

  @Cron('0-59/20 * * * *')
  async restartCrawling() {
    const users = await this.userExportsService.getUserIDsIsNotCycle();
    await this.updateUsers(users);
  }

  private async updateUsers(users: string[]) {
    const getUserLists = (users: string[]) => {
      const chunkSize = Math.ceil(users.length / 100);
      const chunk = [];

      for (let i = 0; i < users.length; i += chunkSize) {
        chunk.push(users.slice(i, i + chunkSize));
      }

      return chunk;
    };

    const fetchUsers = async (users: string[]) => {
      for (const user of users) {
        await this.updateUser(user, 0);
      }
    };

    const usersChunks = getUserLists(users);
    await Promise.all([usersChunks.map((users) => fetchUsers(users))]);
  }

  /** 시간 간격 함수
   * @param ms 밀리초 */
  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
