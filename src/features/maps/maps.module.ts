import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { Maps } from '~/maps/entities/maps.entity';
import { Events } from '~/maps/entities/events.entity';
import { Brawlers } from '~/brawlers/entities/brawlers.entity';
import MapsService from '~/maps/maps.service';
import { BattleStats } from '~/brawlers/entities/battle-stats.entity';
import { MapRotation } from '~/maps/entities/map-rotation.entity';
import { UtilAxiosModule } from '~/utils/axios/axios.module';
import { UtilCacheModule } from '~/utils/cache/cache.module';
import { UtilConfigModule } from '~/utils/config/config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Brawlers,
      BattleStats,
      Maps,
      MapRotation,
      Events,
    ]),
    UtilAxiosModule,
    UtilCacheModule,
    UtilConfigModule,
  ],
  providers: [MapsService],
  exports: [MapsService],
})
export class MapsModule {}
