import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BrawlersModule } from '~/brawlers/brawlers.module';
import { MapsModule } from '~/maps/maps.module';
import { SeasonModule } from '~/season/season.module';
import { UtilsModule } from '~/utils/utils.module';
import { UsersController } from '~/users/users.controller';
import UsersService from '~/users/services/users.service';
import UserBattlesService from '~/users/services/user-battles.service';
import UserExportsService from '~/users/services/user-exports.service';

import { Users } from '~/users/entities/users.entity';
import { UserBattles } from '~/users/entities/user-battles.entity';
import { UserProfile } from '~/users/entities/user-profile.entity';
import {
  UserBrawlerBattles,
  UserBrawlerItems,
  UserBrawlers,
} from '~/users/entities/user-brawlers.entity';
import { BrawlerItems } from '~/brawlers/entities/brawlers.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Users,
      UserProfile,
      UserBattles,
      UserBrawlers,
      UserBrawlerBattles,
      UserBrawlerItems,
      BrawlerItems,
    ]),
    BrawlersModule,
    MapsModule,
    SeasonModule,
    UtilsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, UserBattlesService, UserExportsService],
  exports: [UserExportsService],
})
export class UsersModule {}
