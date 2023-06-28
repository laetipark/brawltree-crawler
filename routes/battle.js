import express from "express";
import {battleService} from "../services/index.js";
import {seasonService} from "../services/service_season.js";

const router = express.Router();

router.get('/', async (req, res) => {
    const {date} = req.query;
    const nextDate = new Date(new Date(date).getTime() + 1000 * 60 * 60 * 24);
    const {type} = req.query;
    const {mode} = req.query;

    const gameModesTL = await battleService.selectMapModeTL();
    const gameModesPL = await battleService.selectMapModePL();
    const season = await seasonService.selectRecentSeason();
    const battles = await battleService.selectBattlesSummary(date, nextDate, type, mode);

    res.send({
        gameModesTL: gameModesTL,
        gameModesPL: gameModesPL,
        battles: battles,
        season: season
    });
});

router.get('/:id', async (req, res) => {
    const id = req.params.id;
    const {date} = req.query;
    const nextDate = new Date(new Date(date).getTime() + 1000 * 60 * 60 * 24);

    const season = await seasonService.selectRecentSeason();
    const [member, battles] = await battleService.selectBattlesDetail(id, date, nextDate);

    res.send({
        member: member,
        battles: battles,
        season: season
    });
});

export default router;