import Battle from '../models/battle.js';
import Rotation from '../models/rotation.js';
import Friend from '../models/friend.js';
import sequelize, {Op} from 'sequelize';
import Season from "../models/season.js";

export default async (members) => {
    console.log('🌸 GET START : FRIEND');

    const season = await Season.findOne({
        raw: true,
        order: [['start_date', 'DESC']],
    }).then(result => {
        return result;
    });

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
            [sequelize.literal('count(case when match_result = -1 then 1 end)'), 'victory_count'],
            [sequelize.literal('count(case when match_result = 1 then 1 end)'), 'defeat_count']],
        group: ['member_id', 'player_id', 'player_name', 'match_type', 'match_grade', 'Rotation.mode'],
        where: {
            player_id: {
                [Op.ne]: sequelize.col('Battle.member_id'),
                [Op.in]: members,
            },
            match_date: {
                [Op.between]: [season.start_date, season.end_date]
            },
            match_type: {
                [Op.in]: [0, 2, 3]
            },
            match_mode: {
                [Op.in]: [2, 3]
            },
            match_grade: {
                [Op.lt]: 7
            }
        },
        raw: true
    }).then(result => {
        return result;
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
            member_id: friend.member_id,
            friend_id: friend.player_id,
            map_mode: friend.mode,
            match_type: friend.match_type,
            match_grade: friend.match_grade,
            friend_name: friend.player_name,
            match_count: friend.match_count,
            victory_count: friend.victory_count,
            defeat_count: friend.defeat_count,
            point: point
        });
    }

    await Friend.destroy({
        where: {
            [Op.or]: {
                member_id: {
                    [Op.notIn]: members,
                },
                friend_id: {
                    [Op.notIn]: members,
                }
            }
        }
    });
}