import axios from 'axios';
import { Repository } from 'typeorm';

import { UserBattles, Users } from '~/entities/users.entity';
import { UserFriends, UserRecords } from '~/entities/blossom.entity';
import { Maps } from '~/entities/maps.entity';
import { CreateUsersDto } from '~/dto/create-users.dto';

import AuthService from './auth.service';

import config from '~/configs/config';
import crewJSON from '~/public/json/crew.json';

export default class BlossomService {
  constructor(
    private users: Repository<Users>,
    private userBattles: Repository<UserBattles>,
    private userFriends: Repository<UserFriends>,
    private userRecords: Repository<UserRecords>,
    private authService: AuthService,
  ) {}

  /** Blossom Members Account update
   * @return Blossom Member ID Array */
  async updateMembers(): Promise<string[]> {
    /** @type CreateUsersDto[] 클럽 멤버  */
    const clubMembers: Users[] = await axios({
      url: `${config.url}/clubs/%23C2RCY8C2/members`,
      method: 'GET',
      headers: config.headers,
    })
      .then((res) => {
        const members = res.data;
        return members.items.map(({ name, tag }) => {
          return {
            userID: tag,
            lastBattleAt: new Date(0),
            crew: 'Blossom',
            crewName: name,
          };
        });
      })
      .catch((err) => console.error(err));

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

    /** Upsert blossom 멤버 및 Update memberIDs에 없는 멤버 null */
    await this.users.upsert(members, ['userID']);
    await this.users
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

    return memberIDs;
  }

  /** Update Blossom Members UserProfile
   * @param members Member ID Array */
  async updateMemberProfiles(members: string[]) {
    await Promise.all(
      /** member profile update
       * @param member 멤버 ID*/
      members.map(async (member) => {
        const user = await this.authService.getUserProfile(
          member.replace('#', ''),
        );

        if (user !== undefined) {
          await this.authService.updateUserProfile(user);
        }
      }),
    );
  }

  /** Update Blossom Members UserFriends
   * @param members Member ID Array */
  async updateMemberFriends(members: string[], date: string) {
    const friends = [];

    await Promise.all(
      members.map(async (member) => {
        await this.userBattles
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
          .andWhere(
            '(ub.matchType = 0 OR (ub.matchType = 3 AND ub.matchTypeRaw = 3))',
          )
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
      (await this.userFriends
        .createQueryBuilder()
        .insert()
        .values(friends)
        .orIgnore()
        .execute());
  }

  /** Blossom 멤버 UserRecords update
   * @param members Member ID Array */
  async updateMemberRecords(members: string[], date: string) {
    const records = [];

    await Promise.all(
      members.map(async (member) => {
        await this.userBattles
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
              '(ub.matchType = 0 OR (ub.matchType = 3 AND ub.matchTypeRaw = 3)))',
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
      (await this.userRecords
        .createQueryBuilder()
        .insert()
        .values(records)
        .orIgnore()
        .execute());
  }
}
