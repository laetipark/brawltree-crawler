import axios from 'axios';

import config from '~/configs/config';

export class ClubService {
  async getClubList() {
    const clubs = await axios({
      url: `${config.url}/rankings/global/clubs?limit=200`,
      method: 'GET',
      headers: config.headers,
    })
      .then((res) => {
        return res.data;
      })
      .catch((err) => console.error(err));

    return clubs.items.map((club) => club.tag);
  }

  async getClubMembers(clubTag: string) {
    return await axios({
      url: `${config.url}/clubs/${clubTag.replace('#', '%23')}/members`,
      method: 'GET',
      headers: config.headers,
    })
      .then(async (res) => {
        const members = await res.data;
        return members.items.map((club) => club.tag);
      })
      .catch((err) => console.error(err));
  }
}
