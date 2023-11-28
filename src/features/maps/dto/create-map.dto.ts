import { IsString } from 'class-validator';

export class CreateMapDto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsString()
  mode!: string;
}
