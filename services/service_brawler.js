import brawlerJSON from "../public/json/brawler.json" assert {type: "json"};

import Brawler from "../models/brawler.js";

export class brawlerService {
    static insertBrawler = async () => {
        for (const item of brawlerJSON.items) {
            await Brawler.upsert({
                id: item.id,
                name: item.name,
                rarity: item.rarity,
                class: item.class,
                gender: item.gender,
                icon: item.icon
            });
        }
    }
}