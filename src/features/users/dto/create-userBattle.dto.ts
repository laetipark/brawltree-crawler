import { IsBoolean, IsDateString, IsNumber, IsString } from 'class-validator';

export class CreateUserBattleDto {
  @IsString()
  userID!: string;

  @IsString()
  playerID!: string;

  @IsString()
  brawlerID!: string;

  @IsDateString()
  battleTime!: Date;

  @IsString()
  mapID!: string;

  @IsNumber()
  modeCode!: number;

  @IsNumber()
  matchType!: number;

  @IsNumber()
  matchGrade!: number;

  @IsNumber()
  duration!: number;

  @IsNumber()
  gameRank!: number;

  @IsNumber()
  gameResult!: number;

  @IsNumber()
  trophyChange!: number;

  @IsNumber()
  duelsTrophyChange!: number;

  @IsString()
  playerName!: string;

  @IsNumber()
  teamNumber!: number;

  @IsBoolean()
  isStarPlayer!: boolean;

  @IsNumber()
  brawlerPower!: number;

  @IsNumber()
  brawlerTrophies!: number;
}
