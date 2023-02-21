import BattleLog from '../models/battle_log.js';
import Pick from '../models/pick.js';
import sequelize from 'sequelize'

export default async () => {
    console.log('🌸 GET START : PICK');

    const picks = await BattleLog.findAll({
        attributes: ['map_id', 'player_brawler_id', 'game_type', 'trophy_grade',
            [sequelize.literal('count(trophy_grade)'), 'match'],
            [sequelize.literal('count(case when game_result = 0 then 1 end)'), 'win']],
        group: ['map_id', 'player_tag', 'player_brawler_id', 'game_type', 'trophy_grade'],
        raw: true
    }).then((res) => {
        return res;
    });

    for (const pick of picks) {
        await Pick.upsert({
            id: `${pick.map_id}_${pick.player_brawler_id}_${pick.game_type}`,
            map_id: pick.map_id,
            brawler_id: pick.player_brawler_id,
            battle_type: pick.game_type,
            trophy_grade: pick.trophy_grade,
            match: pick.match,
            win: pick.win
        });
    }
}