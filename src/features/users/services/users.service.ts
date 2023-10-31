import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom, map } from 'rxjs';

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from '~/users/entities/users.entity';
import { Repository } from 'typeorm';
import { CreateUsersDto } from '~/users/dto/create-users.dto';

@Injectable()
export default class UsersService {
  constructor(
    @InjectRepository(Users)
    private users: Repository<Users>,
    private readonly httpService: HttpService,
  ) {}

  async insertUser(createUsersDto: CreateUsersDto): Promise<Users> {
    const user = Users.from(createUsersDto);
    return await this.users.save(user);
  }

  /** Get UserProfile JSON
   * @param userID User ID */
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
