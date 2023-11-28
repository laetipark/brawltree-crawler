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

  async insertUser(createUsersDto: CreateUserDto): Promise<Users> {
    return await this.users.save(this.users.create(createUsersDto));
  }
}
