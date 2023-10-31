import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ConfigModule } from '@nestjs/config';
import AppConfig from '~/configs/app.config';
import DatabaseConfig from '~/configs/database.config';
import AppConfigService from './configs/app-config.service';
import { UsersModule } from '~/users/users.module';
import { BrawlersModule } from '~/brawlers/brawlers.module';
import { SeasonsModule } from '~/seasons/seasons.module';
import { WorkerModule } from './worker/worker.module';
import { MapsModule } from '~/maps/maps.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `${__dirname}/configs/env/.${process.env.NODE_ENV}.env`,
      load: [AppConfig],
    }),
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),
    UsersModule,
    BrawlersModule,
    SeasonsModule,
    MapsModule,
    WorkerModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppConfigService],
})
export class AppModule {}
