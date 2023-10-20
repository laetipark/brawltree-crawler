import dataSource from '~/configs/database.config';
import { UserBattles, UserProfile, Users } from '~/entities/users.entity';
import {
  UserBrawlerBattles,
  UserBrawlerItems,
  UserBrawlers,
} from '~/entities/user-brawlers.entity';
import { UserFriends, UserRecords } from '~/entities/blossom.entity';

import { Brawlers } from '~/entities/brawlers.entity';
import { BattleTrio, BrawlerStats } from '~/entities/brawler-stats.entity';
import { MapRotation, Maps } from '~/entities/maps.entity';
import { Events } from '~/entities/events.entity';
import { Seasons } from '~/entities/seasons.entity';

const initialize = () =>
  dataSource
    .initialize()
    .then(() => console.log(`🌸 | Brawl Tree Database ON, ${new Date()}`));

export default initialize;

export const usersRepository = dataSource.getRepository(Users);
export const userProfileRepository = dataSource.getRepository(UserProfile);
export const userBattlesRepository = dataSource.getRepository(UserBattles);
export const userBrawlersRepository = dataSource.getRepository(UserBrawlers);
export const userBrawlerBattlesRepository =
  dataSource.getRepository(UserBrawlerBattles);
export const userBrawlerItemsRepository =
  dataSource.getRepository(UserBrawlerItems);

export const brawlersRepository = dataSource.getRepository(Brawlers);
export const battleTrioRepository = dataSource.getRepository(BattleTrio);
export const brawlerStatsRepository = dataSource.getRepository(BrawlerStats);

export const mapsRepository = dataSource.getRepository(Maps);
export const mapRotationRepository = dataSource.getRepository(MapRotation);
export const eventsRepository = dataSource.getRepository(Events);
export const seasonRepository = dataSource.getRepository(Seasons);
export const userFriendsRepository = dataSource.getRepository(UserFriends);
export const userRecordsRepository = dataSource.getRepository(UserRecords);
