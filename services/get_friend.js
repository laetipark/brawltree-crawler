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
        attributes: ['member_id', 'player_tag', 'game_type', 'trophy_grade', 'Rotation.mode',
            [sequelize.literal('count(trophy_grade)'), 'match'],
            [sequelize.literal('count(case when game_result = 0 then 1 end)'), 'win']],
        group: ['member_id', 'player_tag', 'game_type', 'trophy_grade', 'Rotation.mode'],
        where: {
            player_tag: {
                [Op.ne]: sequelize.col(`BattleLog.member_id`),
                [Op.in]: members,
            }
        },
        raw: true,
    }).then((res) => {
        return res;
    });

    for (const friend of friends) {
        await Friend.upsert({
            id: `${friend.member_id}_${friend.player_tag}_${friend.game_type}_${friend.mode}`,
            member_id: friend.member_id,
            friend_id: friend.player_tag,
            game_type: friend.game_type,
            map_mode: friend.mode,
            trophy_grade: friend.trophy_grade,
            match: friend.match,
            win: friend.win
        });
    }

    await Friend.destroy({
        where: {
            member_id: {
                [Op.notIn]: members,
            }
        },
    });

    await Friend.destroy({
        where: {
            friend_id: {
                [Op.notIn]: members,
            }
        },
    });
}