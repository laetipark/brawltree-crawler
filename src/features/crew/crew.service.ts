import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { firstValueFrom, map } from 'rxjs';
import { isMainThread } from 'worker_threads';

import { UserFriends, UserRecords } from './entities/crew.entity';
import { UserBattles } from '~/users/entities/user-battles.entity';
import { Users } from '~/users/entities/users.entity';
import { Maps } from '~/maps/entities/maps.entity';
import { CreateUserDto } from '~/users/dto/create-user.dto';
import UserExportsService from '~/users/services/user-exports.service';
import crewJSON from '~/public/json/crew.json';

@Injectable()
export default class CrewService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Users) private readonly users: Repository<Users>,
    @InjectRepository(UserBattles)
    private readonly userBattles: Repository<UserBattles>,
    @InjectRepository(UserFriends)
    private readonly userFriends: Repository<UserFriends>,
    @InjectRepository(UserRecords)
    private readonly userRecords: Repository<UserRecords>,
    private readonly usersService: UserExportsService,
    private readonly httpService: HttpService,
  ) {}

  /** Blossom Members Account update
   * @return Blossom Member ID Array */
  async updateMembers(): Promise<string[]> {
    /** @type CreateUserDto[] 클럽 멤버  */
    const clubMembers: Users[] = await firstValueFrom(
      this.httpService.get('/clubs/%23C2RCY8C2/members').pipe(
        map((res) => {
          const members = res.data;
          return members.items.map(({ name, tag }) => {
            return {
              id: tag,
              lastBattledOn: new Date(1000),
              crew: 'Blossom',
              crewName: name,
            };
          });
        }),
      ),
    );

    /** @type CreateUserDto[] 크루 멤버  */
    const crewMembers: CreateUserDto[] = crewJSON.map((member) => {
      return {
        id: member.tag,
        lastBattledOn: new Date(1000),
        crew: 'Team',
        crewName: member.name,
      };
    });

    const memberGroup = crewMembers.concat(clubMembers);
    /** @type CreateUserDto[] 클럽 + 크루 멤버 */
    const members: CreateUserDto[] = memberGroup.filter((item1, idx1) => {
      return (
        memberGroup.findIndex((item2) => {
          return item1.id === item2.id;
        }) === idx1
      );
    });
    /** @type string[] 클럽 + 크루 멤버 ID */
    const memberIDs: string[] = members.map((member) => member.id);

    await this.dataSource.transaction(async (manager) => {
      const usersRepository = manager.withRepository(this.users);
      /** Upsert blossom 멤버 및 Update memberIDs에 없는 멤버 null */
      await usersRepository.upsert(members, ['id']);
      await usersRepository
        .createQueryBuilder()
        .update()
        .set({
          crew: null,
          crewName: null,
        })
        .where('id NOT IN (:id)', {
          id: memberIDs,
        })
        .execute();
    });

    return memberIDs;
  }

  /** Update Blossom Members UserProfile
   * @param members Member ID Array */
  async updateMemberProfiles(members: string[]) {
    await Promise.all(
      /** member profile update
       * @param member 멤버 ID*/
      members.map(async (member) => {
        const user = await this.usersService.getUser(member.replace('#', ''));

        if (user !== undefined) {
          await this.usersService.updateUserProfile(user);
        }
      }),
    );
  }

  /** Update Blossom Members UserFriends
   * @param members Member ID Array */
  async updateMemberFriends(members: string[]) {
    const friends = [];

    await this.dataSource.transaction(async (manager) => {
      const userBattlesRepository = manager.withRepository(this.userBattles);
      const userFriendsRepository = manager.withRepository(this.userFriends);

      await Promise.all(
        members.map(async (member) => {
          await userBattlesRepository
            .createQueryBuilder('ub')
            .select('ub.userID', 'userID')
            .addSelect('ub.playerID', 'friendID')
            .addSelect('ub.matchType', 'matchType')
            .addSelect('ub.matchGrade', 'matchGrade')
            .addSelect('ub.playerName', 'name')
            .addSelect('COUNT(*)', 'matchCount')
            .addSelect(
              'COUNT(CASE WHEN ub.gameResult = -1 THEN 1 END)',
              'victoryCount',
            )
            .addSelect(
              'COUNT(CASE WHEN ub.gameResult = 1 THEN 1 END)',
              'defeatCount',
            )
            .addSelect(
              'ROUND(SUM(' +
                'CASE WHEN ub.gameResult = -1 THEN 0.005 * CAST(ub.matchGrade AS UNSIGNED) ' +
                'WHEN ub.gameResult = 0 THEN 0.0025 * CAST(ub.matchGrade AS UNSIGNED) ' +
                'ELSE 0.001 * CAST(ub.matchGrade AS UNSIGNED) END)' +
                ', 2)',
              'friendPoints',
            )
            .addSelect('m.mode', 'mode')
            .innerJoin(Maps, 'm', 'ub.mapID = m.id')
            .where('ub.userID = :id AND ub.playerID != :id', {
              id: member,
            })
            .andWhere('ub.playerID IN (:ids)', {
              ids: members,
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

  /** Blossom Members UserRecords update
   * @param members Member ID Array  */
  async updateMemberRecords(members: string[]) {
    const records = [];

    await this.dataSource.transaction(async (manager) => {
      const userBattlesRepository = manager.withRepository(this.userBattles);
      const userRecordsRepository = manager.withRepository(this.userRecords);

      await Promise.all(
        members.map(async (member) => {
          await userBattlesRepository
            .createQueryBuilder('ub')
            .select('ub.userID', 'userID')
            .addSelect('ub.matchType', 'matchType')
            .addSelect('ub.matchGrade', 'matchGrade')
            .addSelect(
              'SUM(CASE WHEN ub.matchType = 0 THEN ub.trophyChange + ub.trophyChange ELSE 0 END)',
              'trophyChange',
            )
            .addSelect('COUNT(*)', 'matchCount')
            .addSelect(
              'COUNT(CASE WHEN ub.gameResult = -1 THEN 1 END)',
              'victoryCount',
            )
            .addSelect(
              'COUNT(CASE WHEN ub.gameResult = 1 THEN 1 END)',
              'defeatCount',
            )
            .addSelect('m.mode', 'mode')
            .innerJoin(Maps, 'm', 'ub.mapID = m.id')
            .where('(ub.userID = :id1 AND ub.playerID = :id1', {
              id1: member,
            })
            .orWhere(
              '(ub.userID = :id2 AND ub.playerID = :id2 AND ' +
                '(ub.matchType = 0 OR (ub.matchType = 3)))',
              {
                id2: member,
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

  /** 크루 멤버 주기적 정보 갱신 */
  @Cron('0-59/20 * * * *')
  async updateCrewMembers() {
    if (isMainThread) {
      const members = await this.updateMembers();
      const date = new Date();
      date.setSeconds(0);
      date.setMilliseconds(0);

      await this.updateMemberProfiles(members);
      await this.updateMemberFriends(members);
      await this.updateMemberRecords(members);
    }
  }
}
