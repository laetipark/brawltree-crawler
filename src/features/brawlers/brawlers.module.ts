import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Brawlers } from '~/brawlers/entities/brawlers.entity';
import { UserBattles } from '~/users/entities/user-battles.entity';
import BrawlersService from '~/brawlers/brawlers.service';
import { BattleStats } from '~/brawlers/entities/battle-stats.entity';
import { Maps } from '~/maps/entities/maps.entity';
import { UtilsModule } from '~/utils/utils.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Brawlers, BattleStats, Maps, UserBattles]),
    UtilsModule,
  ],
  providers: [BrawlersService],
  exports: [BrawlersService],
})
export class BrawlersModule {}
