import { Module } from '@nestjs/common';
import { WorkersService } from './services/workers.service';
import { WorkerService } from './services/worker.service';
import { UsersModule } from '~/users/users.module';
import { BrawlersModule } from '~/brawlers/brawlers.module';
import { MapsModule } from '~/maps/maps.module';
import { SeasonsModule } from '~/seasons/seasons.module';
import { UtilsModule } from '~/utils/utils.module';

@Module({
  imports: [
    UsersModule,
    BrawlersModule,
    MapsModule,
    SeasonsModule,
    UtilsModule,
  ],
  providers: [WorkersService, WorkerService],
})
export class WorkersModule {}
