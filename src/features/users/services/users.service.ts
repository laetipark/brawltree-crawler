import { HttpService } from '@nestjs/axios';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { catchError, firstValueFrom, map } from 'rxjs';

import { Users } from '~/users/entities/users.entity';
import { CreateUsersDto } from '~/users/dto/create-users.dto';

@Injectable()
export default class UsersService {
  constructor(
    @InjectRepository(Users)
    private readonly users: Repository<Users>,
    private readonly httpService: HttpService,
  ) {}

  async insertUser(createUsersDto: CreateUsersDto): Promise<Users> {
    return await this.users.save(this.users.create(createUsersDto));
  }

  /** 사용자 프로필 반환
   * @param userID 사용자 ID */
  async getUser(userID: string) {
    return firstValueFrom(
      this.httpService.get(`players/%23${userID}`).pipe(
        map((res) => {
          return res.data;
        }),
        catchError(() => {
          throw new NotFoundException(`User ${userID} not Found`);
        }),
      ),
    );
  }
}
