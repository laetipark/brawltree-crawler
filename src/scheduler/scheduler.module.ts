import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { CrewModule } from '~/crew/crew.module';
import { MapsModule } from '~/maps/maps.module';
import { BrawlersModule } from '~/brawlers/brawlers.module';
import { SeasonModule } from '~/season/season.module';
import { UsersModule } from '~/users/users.module';

@Module({
  imports: [CrewModule, BrawlersModule, MapsModule, UsersModule, SeasonModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
