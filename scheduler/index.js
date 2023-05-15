import cron from 'node-cron';

import {battleService, brawlerService, memberService, seasonService, rotationService} from '../services/index.js';

export default async () => {

    await cron.schedule('0-59/4 * * * *', async () => {
        const members = await memberService.updateMembers();

        for (const member of members) {
            try {
                await battleService.insertBattles(member);
                await memberService.insertMember(member);
            } catch (error) {
                console.log(`error 발생 : ${member}`);
                console.log(error);
            }
        }
    });

    await cron.schedule('0-59/30 * * * *', async () => {
        await seasonService.insertSeason();
        await battleService.updateMaps();
        await rotationService.insertRotation();
        await rotationService.deleteRotation();
        await brawlerService.insertBrawler();
    });
}