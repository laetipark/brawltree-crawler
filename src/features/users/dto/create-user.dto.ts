import { IsDateString, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  id: string;

  @IsDateString()
  lastBattledOn: Date;

  @IsString()
  crew: string;

  @IsString()
  crewName: string;
}
