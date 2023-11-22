import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import UserProfileService from '~/users/services/user-profile.service';
import UserBattlesService from '~/users/services/user-battles.service';
import http from 'http';
import https from 'https';
import { UtilsModule } from '~/utils/utils.module';
import { SeasonsModule } from '~/seasons/seasons.module';
import UserExportsService from '~/users/services/user-exports.service';
import { BrawlersModule } from '~/brawlers/brawlers.module';
import { MapsModule } from '~/maps/maps.module';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        baseURL: configService.get<string>('axios.baseURL'),
        headers: configService.get<any>('axios.headers'),
        httpAgent: new http.Agent({
          keepAlive: true,
          maxSockets: 25,
        }),
        httpsAgent: new https.Agent({
          keepAlive: true,
          maxSockets: 25,
        }),
        timeout: 60000,
      }),
      inject: [ConfigService],
    }),
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
  providers: [
    UsersService,
    UserProfileService,
    UserBattlesService,
    UserExportsService,
  ],
  exports: [UserExportsService],
})
export class UsersModule {}
