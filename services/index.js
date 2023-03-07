import cron from 'node-cron';

import club from './get_club.js';
import Battle from './get_battle.js';
import Record from './get_record.js';
import Friend from './get_friend.js';
import Pick from "./get_pick.js";
import Member from './get_member.js';
import Brawler from './get_brawler.js';
import Rotation from './get_rotation.js';
import Season from './get_season.js';

export default async () => {
    const members = club.map(row => row.tag);

    await cron.schedule('0-59/4 * * * *', async () => {
        await Battle(members).then(() => {
            console.log("🌸 GET END : BATTLE", new Date());
        }).then(async () => {
            Pick().then(() => {
                console.log("🌸 GET END : PICK", new Date());
            });
            Record(members).then(() => {
                console.log("🌸 GET END : RECORD", new Date());
            });
            Friend(members).then(() => {
                console.log("🌸 GET END : FRIEND", new Date());
            });
            Member(members).then(() => {
                console.log("🌸 GET END : MEMBER", new Date());
            });
        });
    });

    await cron.schedule('0-59/30 * * * *', async () => {
        await Rotation().then(() => {
            console.log("🌸 GET END : ROTATION");
        });
        await Brawler().then(() => {
            console.log("🌸 GET END : BRAWLER");
        });
        await Season().then(() => {
            console.log("🌸 GET END : SEASON");
        });
    });
}