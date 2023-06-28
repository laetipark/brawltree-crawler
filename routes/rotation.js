import express from "express";
import {rotationService} from "../services/index.js";

const router = express.Router();

router.get('/', async (req, res) => {
    const rotation = await rotationService.selectRotation();

    res.send({
        rotation: rotation
    });
});

export default router;