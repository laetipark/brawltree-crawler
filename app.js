import cron from "node-cron";

import {memberService} from "./services/member_service.js";

let members = [];
members = await memberService.updateMembers();

await cron.schedule('0 0 * * *', async () => {
    members = await memberService.updateMembers();
});

await cron.schedule('0-59/10 * * * *', async () => {
    await memberService.updateMemberProfiles(members);
    await memberService.updateMemberFriends(members);
    await memberService.updateMemberRecords(members);
});