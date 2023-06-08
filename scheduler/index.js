import cron from 'node-cron';

import {battleService, brawlerService, memberService, seasonService, rotationService} from '../services/index.js';

export default async () => {

    await cron.schedule('0 0 * * *', async () => {
        const members = await memberService.updateMembers();
        await memberService.deleteMembers(members);
        for (const member of members) {
            await battleService.updatePlayerName(member)
        }
    });

    await cron.schedule('0 17 * * 1', async () => {
        await battleService.backupBattles();
    });

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

    await cron.schedule('5 0-59/5 * * * *', async () => {
        await rotationService.insertRotation();
        await rotationService.deleteRotation();
    });

    await cron.schedule('0-50/20 * * * *', async () => {
        await brawlerService.insertBrawler();
        await rotationService.updateMaps();
        await rotationService.updateIsRotation();
        await seasonService.insertSeason();
    });
}