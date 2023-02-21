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
            [sequelize.literal('count(trophy_grade)'), 'match'],
            [sequelize.literal('count(case when game_result = 0 then 1 end)'), 'win']],
        group: ['member_id', 'game_type', 'trophy_grade', 'Rotation.mode'],
        where: sequelize.where(sequelize.col(`BattleLog.member_id`), sequelize.col(`BattleLog.player_tag`)),
        raw: true,
    }).then((res) => {
        return res;
    });

    for (const record of records) {
        await Record.upsert({
            id: `${record.member_id}_${record.game_type}_${record.mode}`,
            member_id: record.member_id,
            game_type: record.game_type,
            map_mode: record.mode,
            trophy_grade: record.trophy_grade,
            match: record.match,
            win: record.win
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