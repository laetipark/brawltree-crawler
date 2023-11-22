import { IsDateString, IsString } from 'class-validator';

export class CreateUsersDto {
  @IsString()
  id: string;

  @IsDateString()
  lastBattledOn: Date;

  @IsString()
  crew: string;

  @IsString()
  crewName: string;
}
