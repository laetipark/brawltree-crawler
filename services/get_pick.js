import BattleLog from '../models/battle.js';
import Pick from '../models/pick.js';
import sequelize from 'sequelize'

export default async () => {
    console.log('🌸 GET START : PICK');

    const picks = await BattleLog.findAll({
        attributes: ['map_id', 'brawler_id', 'raw_type', 'match_grade',
            [sequelize.literal('count(match_grade)'), 'match_count'],
            [sequelize.literal('count(case when match_result = -1 then 1 end)'), 'victory_count']],
        group: ['map_id', 'brawler_id', 'raw_type', 'match_grade'],
        raw: true
    }).then((res) => {
        return res;
    });

    for (const pick of picks) {
        await Pick.upsert({
            map_id: pick.map_id,
            brawler_id: pick.brawler_id,
            match_type: pick.raw_type,
            match_grade: pick.match_grade,
            match_count: pick.match_count,
            victory_count: pick.victory_count
        });
    }
}