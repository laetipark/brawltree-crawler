import { Module } from '@nestjs/common';
import WorkerService from './worker.service';
import { UsersModule } from '~/users/users.module';
import { BrawlersModule } from '~/brawlers/brawlers.module';
import { MapsModule } from '~/maps/maps.module';
import { SeasonModule } from '~/season/season.module';
import { UtilsModule } from '~/utils/utils.module';

@Module({
  imports: [UsersModule, BrawlersModule, MapsModule, SeasonModule, UtilsModule],
  providers: [WorkerService],
})
export class WorkerModule {}
