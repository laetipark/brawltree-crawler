import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import SeasonsService from '~/seasons/seasons.service';
import { Seasons } from '~/seasons/entities/seasons.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Seasons])],
  providers: [SeasonsService],
  exports: [SeasonsService],
})
export class SeasonsModule {}
