import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'map_rotation' })
export class MapRotation {
  @PrimaryColumn({
    name: 'map_id',
    length: 8,
  })
  mapID: string;

  @Column({
    name: 'is_trophy_league',
  })
  isTrophyLeague: boolean;

  @Column({
    name: 'is_power_league',
  })
  isPowerLeague: boolean;
}
