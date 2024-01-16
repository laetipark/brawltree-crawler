import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from '~/users/users.module';
import { BrawlersModule } from '~/brawlers/brawlers.module';
import { MapsModule } from '~/maps/maps.module';
import { SeasonModule } from '~/season/season.module';
import { CrewModule } from '~/crew/crew.module';
import { UtilsModule } from '~/utils/utils.module';
import { SchedulerModule } from '~/scheduler/scheduler.module';

@Module({
  controllers: [AppController],
  imports: [
    CrewModule,
    UsersModule,
    BrawlersModule,
    MapsModule,
    SeasonModule,
    SchedulerModule,
    UtilsModule,
  ],
  providers: [AppService],
})
export class AppModule {}
