import cron from 'node-cron';

import {battleService, memberService} from '../services/index.js';
import {seasonService} from "../services/service_season.js";

export default async () => {

    await cron.schedule('0 0 * * *', async () => {
        const members = await memberService.updateMembers();
        await memberService.deleteMembers(members);
        for (const member of members) {
            await battleService.updatePlayerName(member)
        }
    });

    await cron.schedule('0 17 * * 1', async () => {
        const season = await seasonService.selectSecondRecentSeason();
        await battleService.backupBattles(season);
    });

    await cron.schedule('0-59/4 * * * *', async () => {
        const members = await memberService.updateMembers();
        const season = await seasonService.selectRecentSeason();

        for (const member of members) {
            try {
                await battleService.insertBattles(member);
                await memberService.insertMember(member, season);
                await memberService.updateFriends(members, member, season);
                await memberService.updateRecords(member, season);
            } catch (error) {
                console.log(`error 발생 : ${member}`);
                console.log(error);
            }
        }
    });
}