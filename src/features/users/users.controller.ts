import { Controller, Param, Patch, Post } from '@nestjs/common';
import UsersService from '~/users/services/users.service';
import SuccessResponse from '../../common/enum/success.response';
import UserExportsService from '~/users/services/user-exports.service';

@Controller('brawlian')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private userExportsService: UserExportsService,
  ) {}

  /** 사용자 정보 삽입
   * @param id user tag */
  @Post('/:id')
  async insertUser(@Param('id') id: string) {
    console.log('im here');
    const user = await this.userExportsService.getUser(id);

    await this.usersService.insertUser({
      id: user.tag,
      lastBattledOn: new Date(1000),
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
    const user = await this.userExportsService.getUser(id);

    await this.userExportsService.updateUserProfile(user);
    await this.userExportsService.updateUserBattlesByResponse(
      this.userExportsService.setUserBattleResponse(id),
      id,
    );

    return {
      message: SuccessResponse.USER_UPDATED,
      data: { id },
    };
  }
}
