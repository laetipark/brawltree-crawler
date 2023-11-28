import { Column, Entity, OneToMany, OneToOne, PrimaryColumn } from 'typeorm';
import { BaseEntity } from '~/database/entities/base.entity';
import { Events } from '~/maps/entities/events.entity';
import { UserBrawlerBattles } from '~/users/entities/user-brawlers.entity';
import { MapRotation } from '~/maps/entities/map-rotation.entity';

@Entity({ name: 'maps' })
export class Maps extends BaseEntity {
  @PrimaryColumn({
    length: 8,
  })
  id: string;

  @Column({
    type: 'varchar',
    length: 12,
  })
  mode: string;

  @Column({
    type: 'varchar',
    length: 30,
  })
  name: string;

  @OneToOne(() => MapRotation)
  mapRotation: MapRotation;

  @OneToMany(
    () => UserBrawlerBattles,
    (userBrawlerBattle) => userBrawlerBattle.map,
  )
  userBrawlerBattles: UserBrawlerBattles[];

  @OneToMany(() => Events, (event) => event.map)
  events: Events[];
}
