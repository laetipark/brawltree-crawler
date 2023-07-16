import express from "express";
import {memberService, rotationService} from "../services/index.js";

const router = express.Router();

router.get('/', async (req, res) => {

    const [
        memberSummary,
        memberBrawlerSummaryTL,
        memberBrawlerSummaryPL,
        battleSummary,
        seasonSummary
    ] = await memberService.selectIndexSummary();

    const rotationSummary = await rotationService.selectRotation();

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