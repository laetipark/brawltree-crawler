import axios from 'axios';
import { Repository } from 'typeorm';
import { Brawlers } from '~/entities/brawlers.entity';

import brawlerJSON from '~/public/json/brawlers.json';

import config from '~/configs/config';

export default class BrawlerService {
  constructor(private brawlers: Repository<Brawlers>) {}

  async insertBrawler() {
    const brawlers = await axios({
      url: `${config.url}/brawlers`,
      method: 'GET',
      headers: config.headers,
    })
      .then((res) => {
        return res.data.items.map((brawler) => {
          return {
            brawlerID: brawler.id,
            name: brawler.name,
            rarity:
              brawlerJSON.items.find((item) => item?.id === brawler.id)
                ?.rarity || null,
            role:
              brawlerJSON.items.find((item) => item?.id === brawler.id)
                ?.class || null,
            gender:
              brawlerJSON.items.find((item) => item?.id === brawler.id)
                ?.gender || null,
            icon:
              brawlerJSON.items.find((item) => item?.id === brawler.id)?.icon ||
              null,
            starPowerID1: brawler.starPowers[0].id,
            starPowerName1: brawler.starPowers[0].name,
            starPowerID2: brawler.starPowers[1].id,
            starPowerName2: brawler.starPowers[1].name,
            gadgetID1: brawler.gadgets[0].id,
            gadgetName1: brawler.gadgets[0].name,
            gadgetID2: brawler.gadgets[1].id,
            gadgetName2: brawler.gadgets[1].name,
          };
        });
      })
      .catch((err) => console.error(err));

    await this.brawlers.upsert(brawlers, ['brawlerID']);
  }
}
