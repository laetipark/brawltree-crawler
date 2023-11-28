import { Column, Entity, OneToMany, OneToOne, PrimaryColumn } from 'typeorm';
import { SoftDeleteEntity } from '~/database/entities/base.entity';
import { UserProfile } from '~/users/entities/user-profile.entity';
import { UserBattles } from '~/users/entities/user-battles.entity';
import { UserBrawlers } from './user-brawlers.entity';
import { UserFriends, UserRecords } from '../../crew/entities/crew.entity';

@Entity({ name: 'users' })
export class Users extends SoftDeleteEntity {
  @PrimaryColumn({
    type: 'varchar',
    length: 20,
  })
  id: string;

  @Column({
    name: 'last_battled_on',
    type: 'timestamp',
  })
  lastBattledOn: Date;

  @Column({
    name: 'crew',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  crew: string;

  @Column({
    name: 'crew_name',
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  crewName: string;

  @Column({
    name: 'is_cycle',
    default: false,
  })
  isCycle: boolean;

  @OneToOne(() => UserProfile)
  userProfile: UserProfile;

  @OneToMany(() => UserBattles, (battle) => battle.user)
  userBattles: UserBattles[];

  @OneToMany(() => UserBrawlers, (brawler) => brawler.user)
  userBrawlers: UserBrawlers[];

  @OneToMany(() => UserRecords, (record) => record.user)
  userRecords: UserRecords[];

  @OneToMany(() => UserFriends, (friend) => friend.user)
  userFriends: UserFriends[];
}
