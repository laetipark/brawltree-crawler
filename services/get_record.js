import Battle from '../models/battle.js';
import Rotation from '../models/rotation.js';
import Record from '../models/record.js';
import sequelize, {Op} from 'sequelize';

export default async (members) => {
    console.log('🌸 GET START : RECORD');

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
            [sequelize.literal('count(case when match_result = -1 then 1 end)'), 'victory_count']],
        group: ['member_id', 'match_type', 'match_grade', 'Rotation.mode'],
        where: {
            player_id: [sequelize.col('Battle.member_id')]
        },
        raw: true,
        logging: true
    }).then((res) => {
        return res;
    });

    for (const record of records) {
        await Record.upsert({
            id: `${record.member_id}_${record.mode}_${record.match_type}_${record.match_grade}`,
            member_id: record.member_id,
            map_mode: record.mode,
            match_type: record.match_type,
            match_grade: record.match_grade,
            match_change: record.match_change,
            match_count: record.match_count,
            victory_count: record.victory_count
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