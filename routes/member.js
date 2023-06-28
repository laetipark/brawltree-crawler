import express from "express";
import {memberService} from "../services/index.js";
import {seasonService} from "../services/service_season.js";

const router = express.Router();

router.get('/', async (req, res) => {
    const members = await memberService.selectMembersSummary();

    res.send(members);
});

router.get('/:id', async (req, res) => {
    const id = req.params.id;
    const {date} = req.query;
    const nextDate = new Date(new Date(date).getTime() + 1000 * 60 * 60 * 24);

    const season = await seasonService.selectRecentSeason();
    const [member, battles,
        records, dailyCount, seasonCount,
        friendsGroup, friendsPoint, friends, brawlers] =
        await memberService.selectMemberDetail(id, date, nextDate);

    res.send({
        member: member,
        battles: battles,
        records: records,
        season: season,
        dailyCount: dailyCount,
        seasonCount: seasonCount,
        friendsGroup: friendsGroup,
        friendsPoint: friendsPoint,
        friends: friends,
        brawlers: brawlers
    });
});

export default router;