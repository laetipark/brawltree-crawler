import express from "express";
import {battleService, memberService} from "../services/index.js";
import {seasonService} from "../services/service_season.js";

const router = express.Router();

router.get('/', async (req, res) => {
    const {type} = req.query;
    const {mode} = req.query;

    const gameModesTL = await battleService.selectMapModeTL();
    const gameModesPL = await battleService.selectMapModePL();
    const season = await seasonService.selectRecentSeason();
    const members = await memberService.selectSeasonSummary(type, mode);

    res.send({
        gameModesTL: gameModesTL,
        gameModesPL: gameModesPL,
        members: members,
        season: season
    });
});

export default router;