import { Module } from '@nestjs/common';
import WorkerService from './worker.service';
import { UsersModule } from '~/users/users.module';
import { BrawlersModule } from '~/brawlers/brawlers.module';
import { MapsModule } from '~/maps/maps.module';
import { SeasonModule } from '~/season/season.module';
import { UtilTypeOrmModule } from '~/utils/typeorm/typeorm.module';
import { UtilAxiosModule } from '~/utils/axios/axios.module';
import { UtilCacheModule } from '~/utils/cache/cache.module';
import { UtilConfigModule } from '~/utils/config/config.module';
import { UtilScheduleModule } from '~/utils/schedule/schedule.module';

@Module({
  imports: [
    UsersModule,
    BrawlersModule,
    MapsModule,
    SeasonModule,
    UtilAxiosModule,
    UtilCacheModule,
    UtilConfigModule,
    UtilScheduleModule,
    UtilTypeOrmModule,
  ],
  providers: [WorkerService],
})
export class WorkerModule {}
