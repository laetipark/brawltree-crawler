import { HttpService } from '@nestjs/axios';
import { HttpException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';

import UsersService from '~/users/services/users.service';
import UserProfileService from '~/users/services/user-profile.service';
import UserBattlesService from '~/users/services/user-battles.service';
import DateService from '~/utils/services/date.service';
import { Users } from '~/users/entities/users.entity';
import FailureResponse from '~/interfaces/enum/failure-response.enum';
import UserRequestType from '~/interfaces/types/user-request.type';

export default class UserExportsService {
  constructor(
    @InjectRepository(Users) private readonly users: Repository<Users>,
    private readonly usersService: UsersService,
    private readonly userProfileService: UserProfileService,
    private readonly userBattlesService: UserBattlesService,
    private readonly dateService: DateService,
    private readonly httpService: HttpService,
  ) {}

  async getUsers() {
    return await this.users
      .createQueryBuilder('u')
      .select('REPLACE(u.id, "#", "")', 'userID')
      .orderBy('u.lastBattledOn', 'ASC')
      .getRawMany()
      .then((result) => {
        return result.map((user) => user.userID);
      });
  }

  async getUserCycle() {
    await this.users
      .createQueryBuilder()
      .update()
      .set({
        isCycle: true,
      })
      .execute();
  }

  async getUserEmptyCycle() {
    return await this.users
      .createQueryBuilder('u')
      .select('REPLACE(u.id, "#", "")', 'userID')
      .where('u.isCycle = FALSE')
      .getRawMany()
      .then((result) => {
        return result.map((item) => item.userID);
      });
  }

  /** 사용자 전투 기록 관리
   * @param userID 사용자 ID
   * @param isCycle 요청 순환 여부 */
  async fetchBattleRequest({ userID, isCycle }: UserRequestType) {
    try {
      // 사용자 전투 기록 반환
      const response = await firstValueFrom(
        this.httpService.get(`players/%23${userID}/battlelog`),
      );
      const battleLogs = response.data;

      // 사용자 전투 기록 추가
      battleLogs &&
        (await this.userBattlesService.insertUserBattles(battleLogs, userID));

      /** @type Date 최근 전투 시간 반환 */
      const newUserLastBattle: Date = this.dateService.getDate(
        battleLogs?.items.find((battle: any) => {
          return battle.event.id !== 0;
        }).battleTime,
      );

      /** 사용자 최근 전투 시간 변경 */
      await this.users
        .createQueryBuilder()
        .update()
        .set({
          lastBattledOn: newUserLastBattle,
          cycleCount: 0,
        })
        .where('id = :id', {
          id: `#${userID}`,
        })
        .execute();

      /** 사용자 브롤러 전투 정보 변경 */
      await this.userBattlesService.updateUserBrawlerBattles(userID);

      /** 20분 후에 manageUserRequests 메서드 실행 */
      if (isCycle) {
        setTimeout(
          () => {
            this.fetchBattleRequest({ userID, isCycle: isCycle });
          },
          20 * 60 * 1000,
        );
      }
    } catch (error) {
      Logger.error(JSON.stringify(error.response?.data), userID);
      const errorTime = error.response?.status === 404 ? 50 : 0;

      if (error.response?.status === 404) {
        await this.users
          .createQueryBuilder(`u`)
          .update()
          .set({
            cycleCount: () => `cycleCount + 1`,
          })
          .where('id = :id', {
            id: `#${userID}`,
          })
          .execute();
      }

      const user = await this.users
        .createQueryBuilder(`u`)
        .select(`u.cycleCount`, `cycleCount`)
        .where('u.id = :id', {
          id: `#${userID}`,
        })
        .getRawOne();

      if ((user?.cycleCount || 0) > 9) {
        await this.users.softDelete({
          id: `#${userID}`,
        });
      } else {
        /** 10(60)분 후에 manageUserRequests 실행 */
        setTimeout(
          () => {
            this.fetchBattleRequest({ userID, isCycle: isCycle });
          },
          (10 + errorTime) * 60 * 1000,
        );
      }

      throw new HttpException(
        FailureResponse.USER_BATTLES_UPDATE_FAILED,
        error.response?.status,
      );
    }
  }
}
