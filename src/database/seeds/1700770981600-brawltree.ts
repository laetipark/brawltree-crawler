import axios from 'axios';
import { config } from 'dotenv';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { Users } from '~/users/entities/users.entity';
import { CreateUserDto } from '~/users/dto/create-user.dto';

config({ path: `.production.env` });

export class Brawltree1700770981600 implements MigrationInterface {
  async getClubList() {
    const clubs = await axios({
      url: `https://api.brawlstars.com/v1/rankings/global/clubs?limit=200`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + process.env.API_KEY,
      },
    })
      .then((res) => {
        return res.data;
      })
      .catch((err) => console.error(err));

    return clubs.items.map((club: any) => club.tag);
  }

  async getClubMembers(clubTag: string): Promise<CreateUserDto[]> {
    return await axios({
      url: `https://api.brawlstars.com/v1/clubs/${clubTag.replace(
        '#',
        '%23',
      )}/members`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + process.env.API_KEY,
      },
    })
      .then(async (res) => {
        const members = await res.data;
        return members.items.map((member: any): CreateUserDto => {
          return {
            id: member.tag,
            lastBattledOn: new Date(1000),
            crew: null,
            crewName: null,
          };
        });
      })
      .catch((err) => console.error(err));
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const clubs = await this.getClubList();
    for (const club of clubs) {
      const users = await this.getClubMembers(club);
      for (const user of users) {
        await queryRunner.manager.save(
          Users,
          queryRunner.manager.create(Users, user),
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.manager.delete(Users, {});
  }
}
