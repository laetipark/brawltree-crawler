import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { MapRotation, Maps } from './entities/maps.entity';
import { Events } from './entities/events.entity';
import { Brawlers } from '~/brawlers/entities/brawlers.entity';

import AppConfigService from '~/configs/app-config.service';
import MapsService from '~/maps/maps.service';
import { BrawlerStats } from '~/brawlers/entities/brawler-stats.entity';
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
      BrawlerStats,
      Maps,
      MapRotation,
      Events,
    ]),
  ],
  controllers: [],
  providers: [MapsService, MapsService, DateService, AppConfigService],
})
export class MapsModule {}
