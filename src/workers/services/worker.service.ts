import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import UserExportsService from '~/users/services/user-exports.service';

@Injectable()
export default class WorkerService {
  // 사용자 ID 목록
  private userIDs: string[] = [];

  constructor(private readonly userExportsService: UserExportsService) {}

  /** 사용자들의 ID 정보 반환 */
  async getUserIds(): Promise<string[]> {
    return this.userIDs;
  }

  /** 사용자들의 ID 초기 정보 저장
   * @param users 사용자 ID 배열 */
  async setUserIds(users: string[]) {
    this.userIDs = users;
  }

  /** Worker 사용자에 대한 전투 기록 변경 순환 */
  async fetchWorkerUsers() {
    const getUserLists = (users: string[]) => {
      const chunkSize = Math.ceil(users.length / 10);
      const chunk = [];

      for (let i = 0; i < users.length; i += chunkSize) {
        chunk.push(users.slice(i, i + chunkSize));
      }

      return chunk;
    };

    const fetchUsers = async (users: string[]) => {
      for (const user of users) {
        await this.fetchUserBattles(user);
      }
    };

    const usersChunks = getUserLists(this.userIDs);
    for (const users of usersChunks) {
      await fetchUsers(users);
    }
  }

  async fetchUserBattles(userID: string) {
    const response = this.userExportsService.setUserBattleResponse(userID);
    try {
      const user = await this.userExportsService.getUser(userID);
      await this.userExportsService.updateUserProfile(user);
      const battleLogs = (await firstValueFrom(response.request)).data;

      // 사용자 전투 기록 추가
      battleLogs &&
        this.userExportsService
          .updateUserBattlesByResponse(battleLogs, response.id)
          .then(() =>
            /** 20분 후에 manageUserRequests 메서드 실행 */
            setTimeout(
              () => {
                this.fetchUserBattles(userID);
              },
              20 * 60 * 1000,
            ),
          );
      await this.sleep(2 * 1000);
    } catch (error) {
      Logger.error(
        {
          data: error.response?.data,
          status: error.response?.status,
        },
        `Worker`,
      );
      const errorTime = error.response?.status === 404 ? 50 : 0;

      // 10(60)분 후에 fetchUserBattles 실행
      setTimeout(
        () => {
          this.fetchUserBattles(userID);
        },
        (10 + errorTime) * 60 * 1000,
      );
    }
  }

  /** 시간 간격 함수
   * @param ms 밀리초 */
  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
