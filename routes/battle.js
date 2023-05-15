import express from "express";
import {battleService} from "../services/index.js";

const router = express.Router();

router.get('/', async (req, res) => {
    const {today} = req.query;
    const {tomorrow} = req.query;
    const {type} = req.query;
    const {mode} = req.query;

    const [battles, season] = await battleService.selectBattlesSummary(today, tomorrow, type, mode);

    res.send({
        battles: battles,
        season: season
    });
});

router.get('/:id', async (req, res) => {
    const id = req.params.id;
    const {today} = req.query;
    const {tomorrow} = req.query;

    const [member, battles, season] = await battleService.selectBattlesDetail(id, today, tomorrow);

    res.send({
        member: member,
        battles: battles,
        season: season
    });
});

export default router;