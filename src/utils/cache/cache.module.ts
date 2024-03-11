import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        isGlobal: true,
        store: redisStore,
        host: config.get<string>('redis.host'),
        port: config.get<number>('redis.port'),
      }),
    }),
  ],
  exports: [CacheModule],
})
export class UtilCacheModule {}
