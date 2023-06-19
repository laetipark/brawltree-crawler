import express from "express";
import {brawlerService} from "../services/index.js";

const router = express.Router();

router.get('/', async (req, res) => {
    const {brawler} = req.query;

    const brawlers = await brawlerService.selectBrawlers();
    const [memberBrawlers, battlePicks] =
        await brawlerService.selectBrawlerSummary(brawler);

    res.send({
        brawlers: brawlers,
        memberBrawlers: memberBrawlers,
        battlePicks: battlePicks
    });
});

router.get('/:id', async (req, res) => {
    const id = req.params.id;
    const [member, brawlers, brawlerChange] =
        await brawlerService.selectBrawlersDetail(id);

    res.send({
        member: member,
        brawlers: brawlers,
        brawlerChange: brawlerChange
    });
});

export default router;