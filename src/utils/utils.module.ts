import { Global, Module } from '@nestjs/common';
import DateService from '~/utils/services/date.service';
import AppConfigService from '~/utils/services/app-config.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import http from 'http';
import https from 'https';
import AppConfig from '~/config/app.config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

@Global()
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
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        baseURL: configService.get<string>('axios.baseURL'),
        headers: configService.get<any>('axios.headers'),
        httpAgent: new http.Agent({ keepAlive: true }),
        httpsAgent: new https.Agent({
          keepAlive: true,
          maxSockets: 5,
          timeout: 300000,
        }),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AppConfigService, DateService],
  exports: [HttpModule, AppConfigService, DateService],
})
export class UtilsModule {}
