import express from "express";
import {QueryTypes} from "sequelize";
import {sequelize} from "../models/index.js";

import Season from "../models/season.js";

import config from "../config/config.js";

const router = express.Router();

router.get('/', async (req, res) => {
    const {type} = req.query;
    const {mode} = req.query;
    const matchType = config.typeList.filter.includes(type) ? config.typeList[`${type}`] : config.typeList.all;
    const matchMode = config.modeList.includes(mode) ? Array(mode) : config.modeList;

    const members = await sequelize.query(`SELECT Member.id,
                                                  Member.name,
                                                  COALESCE(Record.match_count, 0)  as 'match_count',
                                                  COALESCE(Record.match_change, 0) as 'match_change',
                                                  COALESCE(Friend.point, 0)        as 'point'
                                           FROM member AS Member
                                                    LEFT OUTER JOIN (select member_id,
                                                                            sum(match_count)  AS match_count,
                                                                            sum(match_change) AS match_change
                                                                     FROM record
                                                                     WHERE match_type IN (:matchType)
                                                                       AND map_mode IN (:matchMode)
                                                                     group by member_id) Record
                                                                    ON
                                                                        Member.id = Record.member_id
                                                    LEFT OUTER JOIN (select member_id,
                                                                            round(sum(point), 2) AS point
                                                                     FROM friend
                                                                     WHERE match_type IN (:matchType)
                                                                       AND map_mode IN (:matchMode)
                                                                     group by member_id) Friend
                                                                    ON
                                                                        Member.id = Friend.member_id
                                           GROUP BY id
                                           ORDER BY match_count DESC`,
        {
            replacements: {matchType: matchType, matchMode: matchMode},
            type: QueryTypes.SELECT
        })

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