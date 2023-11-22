import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { MapRotation } from '~/maps/entities/maps.entity';

@Entity({ name: 'EVENTS' })
export class Events {
  @PrimaryGeneratedColumn({
    name: 'ROTATION_SLT_NO',
    type: 'tinyint',
    unsigned: true,
  })
  slotNumber: number;

  @PrimaryColumn({
    name: 'ROTATION_BGN_DT',
  })
  beginDate: Date;

  @Column({
    name: 'ROTATION_END_DT',
  })
  endDate: Date;

  @Column({
    name: 'MAP_ID',
    length: 8,
  })
  mapID: string;

  @Column({
    name: 'MAP_MDFS',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  modifiers: string;

  @ManyToOne(() => MapRotation, (mapRotation) => mapRotation.events)
  @JoinColumn({ name: 'map_id', referencedColumnName: 'mapID' })
  mapRotation: Relation<MapRotation>;
}
