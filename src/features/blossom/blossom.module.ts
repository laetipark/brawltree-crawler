import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { TypeOrmModule } from '@nestjs/typeorm';
import { MapRotation } from '~/maps/entities/maps.entity';
import { Events } from '~/maps/entities/events.entity';
import { BrawlerStats } from '~/brawlers/entities/brawler-stats.entity';
import { UserBattles, UserProfile, Users } from '~/users/entities/users.entity';
import {
  UserBrawlerBattles,
  UserBrawlerItems,
  UserBrawlers,
} from '~/users/entities/user-brawlers.entity';
import { UserFriends, UserRecords } from './entities/blossom.entity';
import { Seasons } from '~/seasons/entities/seasons.entity';

import BlossomService from './blossom.service';
import DateService from '~/utils/date.service';
import UsersService from '~/users/services/users.service';
import UserProfileService from '~/users/services/user-profile.service';
import UserBattlesService from '~/users/services/user-battles.service';
import SeasonsService from '~/seasons/seasons.service';

import { ConfigModule, ConfigService } from '@nestjs/config';
import AppConfigService from '~/configs/app-config.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        baseURL: configService.get<string>('axios.baseURL'),
        headers: configService.get<any>('axios.headers'),
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      BrawlerStats,
      MapRotation,
      Events,
      Users,
      UserProfile,
      UserBattles,
      UserBrawlers,
      UserBrawlerBattles,
      UserBrawlerItems,
      UserRecords,
      UserFriends,
      Seasons,
    ]),
  ],
  providers: [
    BlossomService,
    UsersService,
    UserProfileService,
    UserBattlesService,
    SeasonsService,
    DateService,
    AppConfigService,
  ],
})
export class BlossomModule {}
