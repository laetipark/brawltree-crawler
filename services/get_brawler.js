import Brawler from '../models/brawler.js';
import brawlerJSON from "../public/json/brawler.json" assert {type: "json"};

export default async () => {
    console.log('🌸 GET START : BRAWLER');

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