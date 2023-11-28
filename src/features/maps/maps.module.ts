import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { Maps } from '~/maps/entities/maps.entity';
import { Events } from '~/maps/entities/events.entity';
import { Brawlers } from '~/brawlers/entities/brawlers.entity';
import MapsService from '~/maps/maps.service';
import { BattleStats } from '~/brawlers/entities/battle-stats.entity';
import { UtilsModule } from '~/utils/utils.module';
import { MapRotation } from '~/maps/entities/map-rotation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Brawlers,
      BattleStats,
      Maps,
      MapRotation,
      Events,
    ]),
    UtilsModule,
  ],
  providers: [MapsService],
  exports: [MapsService],
})
export class MapsModule {}
