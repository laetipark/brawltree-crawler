import SeasonService from '~/services/season.service';
import DateService from '~/services/date.service';
import AuthService from '~/services/auth.service';
import BattleService from '~/services/battle.service';
import BlossomService from '~/services/blossom.service';
import BrawlerService from '~/services/brawler.service';
import EventsService from '~/services/events.service';
import WorkerService from '~/services/worker.service';

import initialize, {
  battleTrioRepository,
  brawlersRepository,
  brawlerStatsRepository,
  eventsRepository,
  mapRotationRepository,
  mapsRepository,
  seasonRepository,
  userBattlesRepository,
  userBrawlerBattlesRepository,
  userBrawlerItemsRepository,
  userBrawlersRepository,
  userFriendsRepository,
  userProfileRepository,
  userRecordsRepository,
  usersRepository,
} from '~/database/database';

export const seasonService = new SeasonService(seasonRepository);
export const dateService = new DateService();
export const authService = new AuthService(
  usersRepository,
  userProfileRepository,
  userBattlesRepository,
  userBrawlersRepository,
  userBrawlerBattlesRepository,
  userBrawlerItemsRepository,
  seasonService,
  dateService,
);
export const battleService = new BattleService(
  battleTrioRepository,
  brawlerStatsRepository,
  mapsRepository,
  userBattlesRepository,
);
export const blossomService = new BlossomService(
  usersRepository,
  userBattlesRepository,
  userFriendsRepository,
  userRecordsRepository,
  authService,
);
export const brawlerService = new BrawlerService(brawlersRepository);
export const eventsService = new EventsService(
  eventsRepository,
  mapsRepository,
  mapRotationRepository,
  dateService,
);
export const workerService = new WorkerService(
  initialize,
  usersRepository,
  authService,
);
