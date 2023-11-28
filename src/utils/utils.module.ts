import { Global, Module } from '@nestjs/common';
import DateService from '~/utils/services/date.service';
import AppConfigService from '~/utils/services/app-config.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import http from 'http';
import https from 'https';

@Global()
@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        baseURL: configService.get<string>('axios.baseURL'),
        headers: configService.get<any>('axios.headers'),
        httpAgent: new http.Agent({ keepAlive: true }),
        httpsAgent: new https.Agent({
          keepAlive: true,
          maxSockets: 2,
          maxFreeSockets: 256,
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
