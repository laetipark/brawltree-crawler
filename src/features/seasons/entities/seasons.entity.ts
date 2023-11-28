import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'seasons' })
export class Seasons {
  @PrimaryGeneratedColumn({
    type: 'tinyint',
    unsigned: true,
  })
  id: number;

  @Column({
    name: 'begin_date',
    type: 'timestamp',
  })
  beginDate: Date;

  @Column({
    name: 'end_date',
    type: 'timestamp',
  })
  endDate: Date;
}
