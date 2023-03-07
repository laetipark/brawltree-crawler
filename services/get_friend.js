import Battle from '../models/battle.js';
import Rotation from '../models/rotation.js';
import Friend from '../models/friend.js';
import sequelize, {Op} from 'sequelize';

export default async (members) => {
    console.log('🌸 GET START : FRIEND');

    const friends = await Battle.findAll({
        include: [
            {
                model: Rotation,
                required: true,
                attributes: []
            },
        ],
        attributes: ['member_id', 'player_id', 'player_name', 'match_type', 'match_grade', 'Rotation.mode',
            [sequelize.literal('count(*)'), 'match_count'],
            [sequelize.literal('count(case when match_result = -1 then 1 end)'), 'victory_count']],
        group: ['member_id', 'player_id', 'player_name', 'match_type', 'match_grade', 'Rotation.mode'],
        where: {
            player_id: {
                [Op.ne]: sequelize.col('Battle.member_id'),
                [Op.in]: members,
            }
        },
        raw: true,
        logging: true
    }).then((res) => {
        return res;
    });

    for (const friend of friends) {
        const calculatePoint = () => {
            if ([0, 4, 5].includes(friend.match_type)) {
                const victoryPoint = (friend.victory_count * (friend.match_grade + 1)) / 200;
                const matchPoint = (friend.victory_count * (friend.match_grade + 1)) / 1000;
                return isNaN(victoryPoint + matchPoint) ? 0 : (victoryPoint + matchPoint).toFixed(2);
            } else if (friend.match_type === 6) {
                const victoryPoint = (friend.victory_count) / 100;
                const matchPoint = (friend.victory_count) / 500;
                return isNaN(victoryPoint + matchPoint) ? 0 : (victoryPoint + matchPoint).toFixed(2);
            } else {
                const victoryPoint = (friend.victory_count * friend.match_grade) / 100;
                const matchPoint = (friend.victory_count * friend.match_grade) / 500;
                return isNaN(victoryPoint + matchPoint) ? 0 : (victoryPoint + matchPoint).toFixed(2);
            }
        }
        const point = calculatePoint()

        await Friend.upsert({
            id: `${friend.member_id}_${friend.player_id}_${friend.mode}_${friend.match_type}_${friend.match_grade}`,
            member_id: friend.member_id,
            friend_id: friend.player_id,
            friend_name: friend.player_name,
            map_mode: friend.mode,
            match_type: friend.match_type,
            match_grade: friend.match_grade,
            match_count: friend.match_count,
            victory_count: friend.victory_count,
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