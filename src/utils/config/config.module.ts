import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UtilConfigService } from './services/util-config.service';
import { DateService } from './services/date.service';
import AppConfig from '~/config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.${process.env.NODE_ENV}.env`,
      load: [AppConfig],
    }),
  ],
  providers: [UtilConfigService, DateService],
  exports: [UtilConfigService, DateService],
})
export class UtilConfigModule {}
