import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Brawlers } from '~/brawlers/entities/brawlers.entity';
import { UserBattles } from '~/users/entities/users.entity';
import DateService from '~/utils/date.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import http from 'http';
import https from 'https';
import BrawlerService from '~/brawlers/brawler.service';
import {
  BattleTrio,
  BrawlerStats,
} from '~/brawlers/entities/brawler-stats.entity';
import { Maps } from '~/maps/entities/maps.entity';

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
      BattleTrio,
      BrawlerStats,
      Maps,
      UserBattles,
    ]),
  ],
  providers: [BrawlerService, DateService],
})
export class BrawlersModule {}
