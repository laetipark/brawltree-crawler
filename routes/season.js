import express from "express";
import {memberService} from "../services/index.js";

const router = express.Router();

router.get('/', async (req, res) => {
    const {type} = req.query;
    const {mode} = req.query;

    const [season, members] = await memberService.selectSeasonSummary(type, mode);

    res.send({
        members: members,
        season: season
    });
});

export default router;