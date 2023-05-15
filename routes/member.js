import express from "express";
import {memberService} from "../services/index.js";

const router = express.Router();

router.get('/', async (req, res) => {
    const members = await memberService.selectMembersSummary();

    res.send(members);
});

router.get('/:id', async (req, res) => {
    const id = req.params.id;
    const {today} = req.query;
    const {tomorrow} = req.query;

    const [member, battles,
        records, season, dailyCount, seasonCount,
        friendsGroup, friendsPoint, friends, brawlers] =
        await memberService.selectMemberDetail(id, today, tomorrow);

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