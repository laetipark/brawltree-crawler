import BattleLog from '../models/battle_log.js';
import Rotation from '../models/rotation.js';
import Friend from '../models/friend.js';
import sequelize, {Op} from 'sequelize';

export default async (members) => {
    console.log('🌸 GET START : FRIEND');

    const friends = await BattleLog.findAll({
        include: [
            {
                model: Rotation,
                required: true,
                attributes: []
            },
        ],
        attributes: ['member_id', 'player_tag', 'player_name', 'game_type', 'trophy_grade', 'Rotation.mode',
            [sequelize.literal('count(*)'), 'match'],
            [sequelize.literal('count(case when game_result = 0 then 1 end)'), 'victory']],
        group: ['member_id', 'player_tag', 'player_name', 'game_type', 'trophy_grade', 'Rotation.mode'],
        where: {
            player_tag: {
                [Op.ne]: sequelize.col('BattleLog.member_id'),
                [Op.in]: members,
            },
            game_type: {
                [Op.in]: [0, 2, 3, 4, 5, 6]
            }
        },
        raw: true,
        logging: true
    }).then((res) => {
        return res;
    });

    for (const friend of friends) {
        const calculatePoint = () => {
            if ([0, 4, 5].includes(friend.game_type)) {
                const victoryPoint = (friend.victory * (friend.trophy_grade + 1)) / 200;
                const matchPoint = (friend.victory * (friend.trophy_grade + 1)) / 1000;
                return isNaN(victoryPoint + matchPoint) ? 0 : (victoryPoint + matchPoint).toFixed(2);
            } else if (friend.game_type === 6) {
                const victoryPoint = (friend.victory) / 100;
                const matchPoint = (friend.victory) / 500;
                return isNaN(victoryPoint + matchPoint) ? 0 : (victoryPoint + matchPoint).toFixed(2);
            } else {
                const victoryPoint = (friend.victory * friend.trophy_grade) / 100;
                const matchPoint = (friend.victory * friend.trophy_grade) / 500;
                return isNaN(victoryPoint + matchPoint) ? 0 : (victoryPoint + matchPoint).toFixed(2);
            }
        }
        const point = calculatePoint()

        await Friend.upsert({
            id: `${friend.member_id}_${friend.player_tag}_${friend.game_type}_${friend.mode}_${friend.trophy_grade}`,
            member_id: friend.member_id,
            friend_id: friend.player_tag,
            friend_name: friend.player_name,
            game_type: friend.game_type,
            map_mode: friend.mode,
            trophy_grade: friend.trophy_grade,
            match: friend.match,
            victory: friend.victory,
            point: point
        });
    }

    await Friend.destroy({
        where: {
            member_id: {
                [Op.notIn]: members,
            },
            friend_id: {
                [Op.notIn]: members,
            }
        }
    });
}