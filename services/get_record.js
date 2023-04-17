import Battle from '../models/battle.js';
import Rotation from '../models/rotation.js';
import Record from '../models/record.js';
import sequelize, {Op} from 'sequelize';
import Season from "../models/season.js";

export default async (members) => {
    console.log('🌸 GET START : RECORD');

    const season = await Season.findOne({
        raw: true,
        order: [['start_date', 'DESC']],
    }).then(result => {
        return result;
    });


    const records = await Battle.findAll({
        include: [
            {
                model: Rotation,
                required: true,
                attributes: []
            },
        ],
        attributes: ['member_id', 'match_type', 'match_grade', 'Rotation.mode',
            [sequelize.literal('sum(case when match_type = 0 then match_change + raw_change else 0 end)'), 'match_change'],
            [sequelize.literal('count(*)'), 'match_count'],
            [sequelize.literal('count(case when match_result = -1 then 0 else null end)'), 'victory_count'],
            [sequelize.literal('count(case when match_result = 1 then 0 else null end)'), 'defeat_count']],
        group: ['member_id', 'match_type', 'match_grade', 'Rotation.mode'],
        where: {
            player_id: {
                [Op.ne]: sequelize.col('Battle.member_id'),
                [Op.in]: members,
            },
            match_date: {
                [Op.between]: [season.start_date, season.end_date]
            },
            [Op.or]: [{
                match_type: {
                    [Op.in]: [0, 2, 3]
                },
                match_mode: {
                    [Op.in]: [2, 3]
                },
            }, {
                match_type: 0,
                match_grade: {
                    [Op.lt]: 7
                },
            }]
        },
        raw: true
    }).then((res) => {
        return res;
    });

    for (const record of records) {
        await Record.upsert({
            member_id: record.member_id,
            map_mode: record.mode,
            match_type: record.match_type,
            match_grade: record.match_grade,
            match_change: record.match_change,
            match_count: record.match_count,
            victory_count: record.victory_count,
            defeat_count: record.defeat_count
        });
    }

    await Record.destroy({
        where: {
            member_id: {
                [Op.notIn]: members,
            }
        },
    });
}