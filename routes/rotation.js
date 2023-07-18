import express from "express";
import {rotationService} from "../services/index.js";

const router = express.Router();

router.get('/', async (req, res) => {
    const rotationTL = await rotationService.selectRotationTL();
    const rotationPL = await rotationService.selectRotationPL();

    res.send({
        rotationTL: rotationTL,
        rotationPL: rotationPL
    });
});

export default router;