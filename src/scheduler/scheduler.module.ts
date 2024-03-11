import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { CrewModule } from '~/crew/crew.module';
import { MapsModule } from '~/maps/maps.module';
import { BrawlersModule } from '~/brawlers/brawlers.module';
import { SeasonModule } from '~/season/season.module';
import { UsersModule } from '~/users/users.module';
import { UtilAxiosModule } from '~/utils/axios/axios.module';
import { UtilCacheModule } from '~/utils/cache/cache.module';
import { UtilConfigModule } from '~/utils/config/config.module';
import { UtilScheduleModule } from '~/utils/schedule/schedule.module';
import { UtilTypeOrmModule } from '~/utils/typeorm/typeorm.module';

@Module({
  imports: [
    CrewModule,
    BrawlersModule,
    MapsModule,
    UsersModule,
    SeasonModule,
    UtilAxiosModule,
    UtilCacheModule,
    UtilConfigModule,
    UtilScheduleModule,
    UtilTypeOrmModule,
  ],
  providers: [SchedulerService],
})
export class SchedulerModule {}
