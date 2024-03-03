import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from '~/users/users.module';
import { BrawlersModule } from '~/brawlers/brawlers.module';
import { MapsModule } from '~/maps/maps.module';
import { SeasonModule } from '~/season/season.module';
import { CrewModule } from '~/crew/crew.module';
import { SchedulerModule } from '~/scheduler/scheduler.module';
import { UtilTypeOrmModule } from '~/utils/typeorm/typeorm.module';
import { UtilAxiosModule } from '~/utils/axios/axios.module';
import { UtilCacheModule } from '~/utils/cache/cache.module';
import { UtilConfigModule } from '~/utils/config/config.module';
import { UtilScheduleModule } from '~/utils/schedule/schedule.module';

@Module({
  controllers: [AppController],
  imports: [
    CrewModule,
    UsersModule,
    BrawlersModule,
    MapsModule,
    SeasonModule,
    SchedulerModule,
    UtilAxiosModule,
    UtilCacheModule,
    UtilConfigModule,
    UtilScheduleModule,
    UtilTypeOrmModule,
  ],
  providers: [AppService],
})
export class AppModule {}
