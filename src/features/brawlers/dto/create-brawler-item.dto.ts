import { IsJSON, IsString } from 'class-validator';

export class CreateBrawlerItemDto {
  @IsString()
  id: string;

  @IsString()
  brawlerID: string;

  @IsString()
  kind: string;

  @IsString()
  name: string;

  @IsJSON()
  values: object;
}
