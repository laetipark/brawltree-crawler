import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import MapsService from '~/maps/maps.service';
import BrawlersService from '~/brawlers/brawlers.service';
import CrewService from '~/crew/crew.service';
import { SeasonDto } from '~/season/dto/season.dto';
import SeasonService from '~/season/season.service';
import UserExportsService from '~/users/services/user-exports.service';

@Injectable()
export class SchedulerService {
  private season: SeasonDto;

  constructor(
    private readonly crewService: CrewService,
    private readonly brawlersService: BrawlersService,
    private readonly mapsService: MapsService,
    private readonly seasonsService: SeasonService,
    private readonly usersService: UserExportsService,
  ) {
    this.season = this.seasonsService.getRecentSeason();
    this.updateBrawlers().then(() => {
      Logger.log(`Brawler Data Initialized`, 'Brawlers');
    });
    this.updateRotation().then(() => {
      Logger.log(`Maps Data Initialized`, 'Maps');
    });
  }

  /** 브롤러 관련 정보 주기적 갱신 */
  @Cron('0 0 * * *')
  async updateBrawlers() {
    await this.brawlersService.insertBrawler();
    await this.brawlersService.updateBattleStats();
  }

  @Cron('30 * * * *')
  async updateMaps() {
    await this.mapsService.insertMaps();
  }

  @Cron('0 * * * *')
  async updateRotation() {
    await this.mapsService.insertRotation();
    await this.mapsService.updateRotation();
    await this.mapsService.deleteRotation();
  }

  @Cron('5 0 18 * * 4')
  async updateSeason() {
    this.season = this.seasonsService.getRecentSeason();
    await this.crewService.updateSeason();
    await this.brawlersService.updateSeason();
    await this.usersService.updateSeason();
  }

  /** 크루 멤버 주기적 정보 갱신 */
  @Cron('5 * * * *')
  async updateCrewMembers() {
    const members = await this.crewService.updateCrewMembers();

    await this.crewService.updateCrewProfiles(members);
    await this.crewService.updateCrewFriends(members, this.season);
    await this.crewService.updateCrewRecords(members, this.season);
  }
}
