import express from "express";
import sequelize, {col, fn, Op} from "sequelize";

import Member from "../models/member.js";
import Record from "../models/record.js";
import Friend from "../models/friend.js";
import Season from "../models/season.js";

import config from "../config/config.js";

const router = express.Router();

router.get('/', async (req, res) => {
    const {type} = req.query;
    const {mode} = req.query;
    const matchType = config.typeList.filter.includes(type) ? config.typeList[`${type}`] : config.typeList.all;
    const matchMode = config.modeList.includes(mode) ? Array(mode) : config.modeList;

    const records = await Record.findAll({
        attributes: [
            "member_id",
            [fn("sum", col("match_count")), "match_count"],
            [fn("sum", col("match_change")), "match_change"],
        ],
        where: {
            match_type: {
                [Op.in]: matchType
            },
            map_mode: {
                [Op.in]: matchMode
            }
        },
        group: ["member_id"],
        raw: true
    }).then((result) => {
        return result;
    });

    const friends = await Friend.findAll({
        attributes: [
            "member_id",
            [fn("sum", col("point")), "point"]
        ],
        where: {
            match_type: {
                [Op.in]: matchType
            },
            map_mode: {
                [Op.in]: matchMode
            }
        },
        group: ["member_id"],
        raw: true
    }).then((result) => {
        return result;
    });

    const members = await Member.findAll({
        attributes: ["id", "name"],
        group: ["id"],
        raw: true
    }).then((result) => {
        result.map(member => {
            const filterRecord = records.find((element) => {
                return element.member_id === member.id;
            });
            const filterFriend = friends.find((element) => {
                return element.member_id === member.id;
            });

            member.records = filterRecord;
            member.friends = filterFriend;
        });
        return result;
    });

    const season = await Season.findOne({
        order: [['start_date', 'DESC']],
        raw: true,
    }).then((result) => {
        return result;
    });

    res.send({
        members: members,
        season: season
    });
});

export default router;