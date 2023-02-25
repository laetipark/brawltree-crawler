import BattleLog from '../models/battle_log.js';
import Rotation from '../models/rotation.js';
import Record from '../models/record.js';
import sequelize, {Op} from 'sequelize';

export default async (members) => {
    console.log('🌸 GET START : RECORD');

    const records = await BattleLog.findAll({
        include: [
            {
                model: Rotation,
                required: true,
                attributes: []
            },
        ],
        attributes: ['member_id', 'game_type', 'Rotation.mode', 'trophy_grade',
            [sequelize.literal('sum(case when game_type = 0 then trophy_change else 0 end)'), 'trophy_change'],
            [sequelize.literal('count(*)'), 'match'],
            [sequelize.literal('count(case when game_result = 0 then 1 end)'), 'victory']],
        group: ['member_id', 'game_type', 'trophy_grade', 'Rotation.mode'],
        where: {
            player_tag: [sequelize.col('BattleLog.member_id')],
            game_type: {
                [Op.in]: [0, 2, 3, 4, 5, 6]
            }
        },
        raw: true,
        logging: true
    }).then((res) => {
        return res;
    });

    for (const record of records) {
        await Record.upsert({
            id: `${record.member_id}_${record.game_type}_${record.mode}_${record.trophy_grade}`,
            member_id: record.member_id,
            game_type: record.game_type,
            map_mode: record.mode,
            trophy_grade: record.trophy_grade,
            trophy_change: record.trophy_change,
            match: record.match,
            victory: record.victory
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