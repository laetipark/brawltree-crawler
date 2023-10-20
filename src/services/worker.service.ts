import { Repository } from 'typeorm';
import { Users } from '~/entities/users.entity';

import AuthService from './auth.service';

import config from '~/configs/config';

export default class WorkerService {
  userIDs: any[];

  constructor(
    private init: () => Promise<void>,
    private users: Repository<Users>,
    private authService: AuthService,
  ) {
    this.userIDs = [];
  }

  async fetchUsers() {
    await this.init();
    const getUserLists = (users: string[]) => {
      const chunkSize = Math.ceil(users.length / 10);
      const userList = [];

      for (let i = 0; i < users.length; i += chunkSize) {
        userList.push(users.slice(i, i + chunkSize));
      }

      return userList;
    };

    const makeAPIRequest = async (user: string) => {
      try {
        await this.users
          .createQueryBuilder()
          .update()
          .set({
            cycleNumber: config.processNumber,
          })
          .where('userID = :id', {
            id: `#${user}`,
          })
          .execute();

        await this.authService.manageUserRequests(user, true);
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
