import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as https from 'https';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        baseURL: configService.get<string>('axios.baseURL'),
        headers: configService.get<any>('axios.headers'),
        httpsAgent: new https.Agent({
          maxSockets: 5,
          timeout: 300000,
        }),
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [HttpModule],
})
export class UtilAxiosModule {}
