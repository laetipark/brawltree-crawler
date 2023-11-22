import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'SEASONS' })
export class Seasons {
  @PrimaryGeneratedColumn({
    name: 'SEASON_NO',
    type: 'tinyint',
    unsigned: true,
  })
  seasonNumber: number;

  @Column({
    name: 'SEASON_BGN_DT',
    type: 'timestamp',
  })
  beginDate: Date;

  @Column({
    name: 'SEASON_END_DT',
    type: 'timestamp',
  })
  endDate: Date;
}
