import express from "express";
import {mapService} from "../services/index.js";

const router = express.Router();

router.get('/', async (req, res) => {

    res.send({
        mapInfo: "hello!"
    });
});

router.get('/:id', async (req, res) => {
    const id = req.params.id;
    const {matchType} = req.query;
    const {matchGrade} = req.query;

    const mapInfo = await mapService.selectMapInfo(id);
    const mapBattlePick = await mapService.selectMapBattlePick(id, matchType, matchGrade);

    res.send({
        mapInfo: mapInfo,
        mapBattlePick: mapBattlePick
    });
});

export default router;