import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { MapRotation } from '~/maps/entities/map-rotation.entity';
import { Events } from '~/maps/entities/events.entity';
import { BattleStats } from '~/brawlers/entities/battle-stats.entity';
import { Users } from '~/users/entities/users.entity';
import {
  UserBrawlerBattles,
  UserBrawlerItems,
  UserBrawlers,
} from '~/users/entities/user-brawlers.entity';
import { UserFriends, UserRecords } from './entities/crew.entity';
import CrewService from './crew.service';
import { UserProfile } from '~/users/entities/user-profile.entity';
import { UserBattles } from '~/users/entities/user-battles.entity';
import { UsersModule } from '~/users/users.module';
import { MapsModule } from '~/maps/maps.module';
import { UtilAxiosModule } from '~/utils/axios/axios.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BattleStats,
      MapRotation,
      Events,
      Users,
      UserProfile,
      UserBattles,
      UserBrawlers,
      UserBrawlerBattles,
      UserBrawlerItems,
      UserRecords,
      UserFriends,
    ]),
    UsersModule,
    MapsModule,
    UtilAxiosModule,
  ],
  providers: [CrewService],
  exports: [CrewService],
})
export class CrewModule {}
