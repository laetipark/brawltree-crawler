import express from "express";
import {brawlerService, memberService, rotationService} from "../services/index.js";

const router = express.Router();

router.get('/', async (req, res) => {

    const [
        memberSummary,
        battleSummary,
        seasonSummary
    ] = await memberService.selectIndexSummary();

    const [
        memberBrawlerSummaryTL,
        memberBrawlerSummaryPL
    ] = await brawlerService.selectBrawlerBattlePickSummary();

    const rotationSummary = await rotationService.selectRotationTL();

    res.send({
        member: memberSummary,
        memberBrawlerTL: memberBrawlerSummaryTL,
        memberBrawlerPL: memberBrawlerSummaryPL,
        battle: battleSummary,
        season: seasonSummary,
        rotation: rotationSummary
    });
});

export default router;