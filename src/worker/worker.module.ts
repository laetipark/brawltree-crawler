import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserBattles, UserProfile, Users } from '~/users/entities/users.entity';
import AppConfigService from '~/configs/app-config.service';
import UserBattlesService from '~/users/services/user-battles.service';
import {
  UserBrawlerBattles,
  UserBrawlerItems,
  UserBrawlers,
} from '~/users/entities/user-brawlers.entity';
import { Brawlers } from '~/brawlers/entities/brawlers.entity';
import { Seasons } from '~/seasons/entities/seasons.entity';
import { MapRotation, Maps } from '~/maps/entities/maps.entity';
import { Events } from '~/maps/entities/events.entity';
import UsersService from '~/users/services/users.service';
import UserProfileService from '~/users/services/user-profile.service';
import MapsService from '~/maps/maps.service';
import SeasonsService from '~/seasons/seasons.service';
import { WorkerService } from './worker.service';
import { WorkerProcess } from './worker.process';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import http from 'http';
import https from 'https';
import DateService from '~/utils/date.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        baseURL: configService.get<string>('axios.baseURL'),
        headers: configService.get<any>('axios.headers'),
        httpAgent: new http.Agent({ keepAlive: true }),
        httpsAgent: new https.Agent({ keepAlive: true }),
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
  providers: [
    WorkerService,
    WorkerProcess,
    UsersService,
    UserProfileService,
    UserBattlesService,
    MapsService,
    SeasonsService,
    DateService,
    AppConfigService,
  ],
})
export class WorkerModule {}
