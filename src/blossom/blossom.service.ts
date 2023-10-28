import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Cron } from '@nestjs/schedule';

import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { firstValueFrom, map } from 'rxjs';

import { UserFriends, UserRecords } from '~/blossom/entities/blossom.entity';
import { UserBattles, Users } from '~/users/entities/users.entity';
import { Maps } from '~/maps/entities/maps.entity';
import { CreateUsersDto } from '~/users/dto/create-users.dto';

import UsersService from '~/users/services/users.service';
import UserProfileService from '~/users/services/user-profile.service';

import crewJSON from '~/public/json/crew.json';
import DateService from '~/utils/date.service';
import SeasonsService from '~/seasons/seasons.service';
import { isMainThread } from 'worker_threads';

@Injectable()
export default class BlossomService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Users) private users: Repository<Users>,
    @InjectRepository(UserBattles) private userBattles: Repository<UserBattles>,
    @InjectRepository(UserFriends) private userFriends: Repository<UserFriends>,
    @InjectRepository(UserRecords) private userRecords: Repository<UserRecords>,
    private seasonsService: SeasonsService,
    private userService: UsersService,
    private userProfileService: UserProfileService,
    private readonly dateService: DateService,
    private readonly httpService: HttpService,
  ) {}

  /** Blossom Members Account update
   * @return Blossom Member ID Array */
  async updateMembers(): Promise<string[]> {
    /** @type CreateUsersDto[] 클럽 멤버  */
    const clubMembers: Users[] = await firstValueFrom(
      this.httpService.get('/clubs/%23C2RCY8C2/members').pipe(
        map((res) => {
          const members = res.data;
          return members.items.map(({ name, tag }) => {
            return {
              userID: tag,
              lastBattleAt: new Date(0),
              crew: 'Blossom',
              crewName: name,
            };
          });
        }),
      ),
    );

    /** @type CreateUsersDto[] 크루 멤버  */
    const crewMembers: CreateUsersDto[] = crewJSON.map((member) => {
      return {
        userID: member.tag,
        lastBattleAt: new Date(0),
        crew: 'Team',
        crewName: member.name,
      };
    });

    const memberGroup = crewMembers.concat(clubMembers);
    /** @type CreateUsersDto[] 클럽 + 크루 멤버 */
    const members: CreateUsersDto[] = memberGroup.filter((item1, idx1) => {
      return (
        memberGroup.findIndex((item2) => {
          return item1.userID === item2.userID;
        }) === idx1
      );
    });
    /** @type string[] 클럽 + 크루 멤버 ID */
    const memberIDs: string[] = members.map((member) => member.userID);

    await this.dataSource.transaction(async (manager) => {
      const usersRepository = manager.withRepository(this.users);
      /** Upsert blossom 멤버 및 Update memberIDs에 없는 멤버 null */
      await usersRepository.upsert(members, ['userID']);
      await usersRepository
        .createQueryBuilder()
        .update()
        .set({
          crew: null,
          crewName: null,
        })
        .where('USER_ID NOT IN (:id)', {
          id: memberIDs,
        })
        .execute();
    });

    return memberIDs;
  }

  /** Update Blossom Members UserProfile
   * @param members Member ID Array */
  async updateMemberProfiles(members: string[]) {
    const season = await this.seasonsService.selectRecentSeason();

    await Promise.all(
      /** member profile update
       * @param member 멤버 ID*/
      members.map(async (member) => {
        const user = await this.userService.getUser(member.replace('#', ''));

        if (user !== undefined) {
          await this.userProfileService.updateUserProfile(user, season);
        }
      }),
    );
  }

  /** Update Blossom Members UserFriends
   * @param members Member ID Array */
  async updateMemberFriends(members: string[], date: string) {
    const friends = [];

    await this.dataSource.transaction(async (manager) => {
      const userBattlesRepository = manager.withRepository(this.userBattles);
      const userFriendsRepository = manager.withRepository(this.userFriends);

      await Promise.all(
        members.map(async (member) => {
          await userBattlesRepository
            .createQueryBuilder('ub')
            .select(`CAST("${date}" AS DATETIME)`, 'aggregationDate')
            .addSelect('ub.userID', 'userID')
            .addSelect('ub.playerID', 'friendID')
            .addSelect('ub.matchType', 'matchType')
            .addSelect('ub.matchGrade', 'matchGrade')
            .addSelect('ub.playerName', 'name')
            .addSelect('COUNT(*)', 'matchCount')
            .addSelect(
              'COUNT(CASE WHEN ub.matchResult = -1 THEN 1 END)',
              'victoryCount',
            )
            .addSelect(
              'COUNT(CASE WHEN ub.matchResult = 1 THEN 1 END)',
              'defeatCount',
            )
            .addSelect(
              'ROUND(SUM(' +
                'CASE WHEN ub.matchResult = -1 THEN 0.005 * CAST(ub.matchGrade AS UNSIGNED) ' +
                'WHEN ub.matchResult = 0 THEN 0.0025 * CAST(ub.matchGrade AS UNSIGNED) ' +
                'ELSE 0.001 * CAST(ub.matchGrade AS UNSIGNED) END)' +
                ', 2)',
              'friendPoints',
            )
            .addSelect('m.mode', 'mode')
            .innerJoin(Maps, 'm', 'ub.mapID = m.mapID')
            .where('ub.userID = :id AND ub.playerID != :id', {
              id: member,
            })
            .andWhere('ub.playerID IN (:ids)', {
              ids: members,
            })
            .andWhere('ub.matchDate BETWEEN :begin AND :end', {
              begin: new Date(new Date(date).getTime() - 70 * 60 * 1000),
              end: new Date(new Date(date).getTime() - 10 * 60 * 1000),
            })
            .andWhere('(ub.matchType = 0 OR (ub.matchType = 3))')
            .groupBy('userID')
            .addGroupBy('friendID')
            .addGroupBy('matchType')
            .addGroupBy('matchGrade')
            .addGroupBy('name')
            .addGroupBy('mode')
            .getRawMany()
            .then((result) => {
              result.length > 0 &&
                result.map((friend) => {
                  friends.push(friend);
                });
            });
        }),
      );

      friends &&
        (await userFriendsRepository
          .createQueryBuilder()
          .insert()
          .values(friends)
          .orIgnore()
          .execute());
    });
  }

  /** Blossom 멤버 UserRecords update
   * @param members Member ID Array */
  async updateMemberRecords(members: string[], date: string) {
    const records = [];

    await this.dataSource.transaction(async (manager) => {
      const userBattlesRepository = manager.withRepository(this.userBattles);
      const userRecordsRepository = manager.withRepository(this.userRecords);

      await Promise.all(
        members.map(async (member) => {
          await userBattlesRepository
            .createQueryBuilder('ub')
            .select(`CAST("${date}" AS DATETIME)`, 'aggregationDate')
            .addSelect('ub.userID', 'userID')
            .addSelect('ub.matchType', 'matchType')
            .addSelect('ub.matchGrade', 'matchGrade')
            .addSelect(
              'SUM(CASE WHEN ub.matchType = 0 THEN ub.matchChange + ub.matchChangeRaw ELSE 0 END)',
              'matchChange',
            )
            .addSelect('COUNT(*)', 'matchCount')
            .addSelect(
              'COUNT(CASE WHEN ub.matchResult = -1 THEN 1 END)',
              'victoryCount',
            )
            .addSelect(
              'COUNT(CASE WHEN ub.matchResult = 1 THEN 1 END)',
              'defeatCount',
            )
            .addSelect('m.mode', 'mode')
            .innerJoin(Maps, 'm', 'ub.mapID = m.mapID')
            .where(
              '(ub.userID = :id1 AND ub.playerID = :id1 AND ' +
                'ub.matchDate BETWEEN :begin AND :end)',
              {
                id1: member,
                begin: new Date(new Date(date).getTime() - 70 * 60 * 1000),
                end: new Date(new Date(date).getTime() - 10 * 60 * 1000),
              },
            )
            .orWhere(
              '(ub.userID = :id2 AND ub.playerID = :id2 AND ' +
                'ub.matchDate BETWEEN :begin AND :end AND ' +
                '(ub.matchType = 0 OR (ub.matchType = 3)))',
              {
                id2: member,
                begin: new Date(Date.now() - 70 * 60 * 1000),
                end: new Date(Date.now() - 10 * 60 * 1000),
              },
            )
            .groupBy('userID')
            .addGroupBy('matchType')
            .addGroupBy('matchGrade')
            .addGroupBy('mode')
            .getRawMany()
            .then((result) => {
              result.length > 0 &&
                result.map((record) => {
                  records.push(record);
                });
            });
        }),
      );

      records &&
        (await userRecordsRepository
          .createQueryBuilder()
          .insert()
          .values(records)
          .orIgnore()
          .execute());
    });
  }

  @Cron('0-59/20 * * * *')
  async updateBlossomMembers() {
    if (isMainThread) {
      const members = await this.updateMembers();
      const date = new Date();
      date.setSeconds(0);
      date.setMilliseconds(0);
      const dateFormat = this.dateService.getDateFormat(date);

      await this.updateMemberProfiles(members);
      await this.updateMemberFriends(members, dateFormat);
      await this.updateMemberRecords(members, dateFormat);
    }
  }
}
