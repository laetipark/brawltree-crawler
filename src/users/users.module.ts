import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersController } from '~/users/users.controller';

import { UserBattles, UserProfile, Users } from '~/users/entities/users.entity';
import {
  UserBrawlerBattles,
  UserBrawlerItems,
  UserBrawlers,
} from '~/users/entities/user-brawlers.entity';
import { Brawlers } from '~/brawlers/entities/brawlers.entity';
import { Events } from '~/maps/entities/events.entity';
import { MapRotation, Maps } from '~/maps/entities/maps.entity';
import { Seasons } from '~/seasons/entities/seasons.entity';

import UsersService from '~/users/services/users.service';
import UserProfileService from '~/users/services/user-profile.service';
import UserBattlesService from '~/users/services/user-battles.service';
import MapsService from '~/maps/maps.service';
import DateService from '~/utils/date.service';
import SeasonsService from '~/seasons/seasons.service';

import AppConfigService from '~/configs/app-config.service';
import http from 'http';
import https from 'https';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        baseURL: configService.get<string>('axios.baseURL'),
        headers: configService.get<any>('axios.headers'),
        httpAgent: new http.Agent({ keepAlive: true }),
        httpsAgent: new https.Agent({ keepAlive: true }),
        timeout: 60000,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      Brawlers,
      Users,
      UserProfile,
      UserBattles,
      UserBrawlers,
      UserBrawlerBattles,
      UserBrawlerItems,
      Seasons,
      Maps,
      MapRotation,
      Events,
    ]),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    UserProfileService,
    UserBattlesService,
    MapsService,
    SeasonsService,
    DateService,
    AppConfigService,
  ],
})
export class UsersModule {}
