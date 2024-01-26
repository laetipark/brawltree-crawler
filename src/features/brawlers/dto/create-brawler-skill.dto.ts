import { IsJSON, IsString } from 'class-validator';

export class CreateBrawlerSkillDto {
  @IsString()
  brawlerID: string;

  @IsJSON()
  values: object;
}
