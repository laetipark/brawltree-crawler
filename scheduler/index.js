import cron from 'node-cron';

import {battleService, brawlerService, memberService, seasonService, rotationService} from '../services/index.js';

export default async () => {

    await cron.schedule('0-59/4 * * * *', async () => {
        const members = await memberService.updateMembers();

        for (const member of members) {
            await battleService.insertBattles(member);
            await memberService.insertMember(member);
        }
        await seasonService.insertRecords(members);
        await seasonService.insertFriends(members);
    });

    await cron.schedule('0-59/30 * * * *', async () => {
        await seasonService.insertPicks();
        await battleService.updateMaps();
        await rotationService.insertRotation();
        await rotationService.deleteRotation();
        await brawlerService.insertBrawler();
    });
}