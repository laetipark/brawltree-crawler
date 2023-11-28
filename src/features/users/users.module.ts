import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersController } from '~/users/users.controller';

import { Users } from '~/users/entities/users.entity';
import { UserBattles } from '~/users/entities/user-battles.entity';
import { UserProfile } from '~/users/entities/user-profile.entity';
import {
  UserBrawlerBattles,
  UserBrawlerItems,
  UserBrawlers,
} from '~/users/entities/user-brawlers.entity';

import UsersService from '~/users/services/users.service';
import UserBattlesService from '~/users/services/user-battles.service';
import { UtilsModule } from '~/utils/utils.module';
import { SeasonsModule } from '~/seasons/seasons.module';
import UserExportsService from '~/users/services/user-exports.service';
import { BrawlersModule } from '~/brawlers/brawlers.module';
import { MapsModule } from '~/maps/maps.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Users,
      UserProfile,
      UserBattles,
      UserBrawlers,
      UserBrawlerBattles,
      UserBrawlerItems,
    ]),
    BrawlersModule,
    MapsModule,
    SeasonsModule,
    UtilsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, UserBattlesService, UserExportsService],
  exports: [UserExportsService],
})
export class UsersModule {}
