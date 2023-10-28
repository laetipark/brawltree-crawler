import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Users } from '~/users/entities/users.entity';

import UserBattlesService from '~/users/services/user-battles.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class WorkerProcess {
  private userIDs: string[] = [];

  constructor(
    @InjectRepository(Users) private users: Repository<Users>,
    private userBattlesService: UserBattlesService,
  ) {}

  async getUserIds(): Promise<string[]> {
    return this.userIDs;
  }

  async setUserIds(users: string[]) {
    this.userIDs = users;
  }

  async fetchUsers() {
    const getUserLists = (users: string[]) => {
      const chunkSize = Math.ceil(users.length / 20);
      const chunk = [];

      for (let i = 0; i < users.length; i += chunkSize) {
        chunk.push(users.slice(i, i + chunkSize));
      }

      return chunk;
    };

    const makeAPIRequest = async (user: string) => {
      try {
        await this.userBattlesService.manageUserRequests(user, true);
      } catch (error) {
        console.error(error);
      }
    };

    const processRequests = async (users: string[]) => {
      await Promise.all(users.map((user: string) => makeAPIRequest(user)));
    };

    await Promise.all(
      getUserLists(this.userIDs).map((users) => processRequests(users)),
    );
  }
}
