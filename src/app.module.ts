import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import AppConfig from './config/app.config';
import { UsersModule } from '~/users/users.module';
import { BrawlersModule } from '~/brawlers/brawlers.module';
import { WorkersModule } from './workers/workers.module';
import { MapsModule } from '~/maps/maps.module';
import { SeasonsModule } from '~/seasons/seasons.module';
import { CrewModule } from './features/crew/crew.module';
import { UtilsModule } from '~/utils/utils.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.${process.env.NODE_ENV}.env`,
      load: [AppConfig],
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get('database'),
    }),
    CrewModule,
    UsersModule,
    BrawlersModule,
    MapsModule,
    SeasonsModule,
    WorkersModule,
    UtilsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
