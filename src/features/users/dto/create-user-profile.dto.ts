import { IsNumber, IsString } from 'class-validator';

export class CreateUserProfileDto {
  @IsString()
  userID: string;

  @IsString()
  name: string;

  @IsString()
  profileIcon: string;

  @IsString()
  clubID: string;

  @IsString()
  clubName: string;

  @IsNumber()
  currentTrophies: number;

  @IsNumber()
  highestTrophies: number;

  @IsNumber()
  trioMatchVictories: number;

  @IsNumber()
  duoMatchVictories: number;

  @IsNumber()
  soloMatchVictories: number;

  @IsNumber()
  brawlerRank25: number;

  @IsNumber()
  brawlerRank30: number;

  @IsNumber()
  brawlerRank35: number;

  @IsNumber()
  currentSoloPL: number;

  @IsNumber()
  highestSoloPL: number;

  @IsNumber()
  currentTeamPL: number;

  @IsNumber()
  highestTeamPL: number;
}
