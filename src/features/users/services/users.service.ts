import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Users } from '~/users/entities/users.entity';
import { CreateUserDto } from '~/users/dto/create-user.dto';

@Injectable()
export default class UsersService {
  constructor(
    @InjectRepository(Users)
    private readonly users: Repository<Users>,
  ) {}

  /** 사용자 정보 추가
   * @param createUsersDto 사용자 생성 DTO */
  async insertUser(createUsersDto: CreateUserDto): Promise<Users> {
    return await this.users.save(this.users.create(createUsersDto));
  }
}
