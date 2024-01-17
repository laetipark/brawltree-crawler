import { IsDateString } from 'class-validator';

export class SeasonDto {
  @IsDateString()
  beginTime: Date;

  @IsDateString()
  endTime: Date;
}
