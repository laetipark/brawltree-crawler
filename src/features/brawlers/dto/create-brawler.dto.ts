import { IsString } from 'class-validator';

export class CreateBrawlerDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  rarity: string;

  @IsString()
  role: string;

  @IsString()
  gender: string;

  @IsString()
  icon: string;
}
