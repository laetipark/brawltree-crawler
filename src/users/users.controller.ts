import { Controller, Param, Patch, Post } from '@nestjs/common';
import UsersService from '~/users/services/users.service';
import UserProfileService from '~/users/services/user-profile.service';
import UserBattlesService from '~/users/services/user-battles.service';
import SeasonsService from '~/seasons/seasons.service';

@Controller('brawlian')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private userProfileService: UserProfileService,
    private userBattlesService: UserBattlesService,
    private seasonsService: SeasonsService,
  ) {}

  @Post('/:id')
  async insertUser(@Param('id') id: string) {
    const user = await this.usersService.getUser(id);

    await this.usersService.insertUser({
      userID: user.tag,
      lastBattleAt: new Date(0),
      crew: null,
      crewName: null,
    });

    return {
      message: `User ${id} Insert Success`,
    };
  }

  @Patch('/:id')
  async updateUser(@Param('id') id: string) {
    const user = await this.usersService.getUser(id);

    const season = await this.seasonsService.selectRecentSeason();
    await this.userProfileService.updateUserProfile(user, season);
    await this.userBattlesService.fetchBattleRequest({
      userID: id,
      cycle: false,
    });

    return {
      message: `User ${id} Update Success`,
    };
  }
}
