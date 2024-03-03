import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  BrawlerItems,
  Brawlers,
  BrawlerSkills,
} from '~/brawlers/entities/brawlers.entity';
import { UserBattles } from '~/users/entities/user-battles.entity';
import BrawlersService from '~/brawlers/brawlers.service';
import { BattleStats } from '~/brawlers/entities/battle-stats.entity';
import { Maps } from '~/maps/entities/maps.entity';
import { UtilConfigModule } from '~/utils/config/config.module';
import { UtilAxiosModule } from '~/utils/axios/axios.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Brawlers,
      BrawlerItems,
      BrawlerSkills,
      BattleStats,
      Maps,
      UserBattles,
    ]),
    UtilAxiosModule,
    UtilConfigModule,
  ],
  providers: [BrawlersService],
  exports: [BrawlersService],
})
export class BrawlersModule {}
