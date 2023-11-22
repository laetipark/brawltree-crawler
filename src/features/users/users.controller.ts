import { Controller, Param, Patch, Post } from '@nestjs/common';
import UsersService from '~/users/services/users.service';
import UserProfileService from '~/users/services/user-profile.service';
import UserBattlesService from '~/users/services/user-battles.service';
import SuccessResponse from '~/interfaces/enum/success.response';
import UserExportsService from '~/users/services/user-exports.service';

@Controller('brawlian')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private userProfileService: UserProfileService,
    private userBattlesService: UserBattlesService,
    private userExportsService: UserExportsService,
  ) {}

  /** 사용자 정보 삽입
   * @param id user tag */
  @Post('/:id')
  async insertUser(@Param('id') id: string) {
    const user = await this.usersService.getUser(id);

    await this.usersService.insertUser({
      id: user.tag,
      lastBattledOn: new Date(0),
      crew: null,
      crewName: null,
    });

    return {
      message: SuccessResponse.USER_INSERTED,
      data: { id },
    };
  }

  /** 사용자 정보 변경
   * @param id user tag */
  @Patch('/:id')
  async updateUser(@Param('id') id: string) {
    const user = await this.usersService.getUser(id);

    await this.userProfileService.updateUserProfile(user);
    await this.userExportsService.fetchBattleRequest({
      userID: id,
      isCycle: false,
    });

    return {
      message: SuccessResponse.USER_UPDATED,
      data: { id },
    };
  }
}
