import Sequelize from "sequelize";

export default class BattleLog extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            member_id: {
                type: Sequelize.STRING(12),
                allowNull: false,
            },
            date: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            duration: {
                type: Sequelize.SMALLINT,
                allowNull: true,
            },
            game_type: {
                type: Sequelize.STRING(1),
                allowNull: false,
            },
            rank: {
                type: Sequelize.STRING(1),
                allowNull: true,
            },
            game_result: {
                type: Sequelize.STRING(1),
                allowNull: true,
            },
            trophy_grade: {
                type: Sequelize.STRING(2),
                allowNull: true,
            },
            trophy_change: {
                type: Sequelize.SMALLINT,
                allowNull: true,
            },
            is_star_player: {
                type: Sequelize.BOOLEAN,
                allowNull: true,
            },
            player_team: {
                type: Sequelize.STRING(1),
                allowNull: true,
            },
            player_tag: {
                type: Sequelize.STRING(12),
                allowNull: true,
            },
            player_name: {
                type: Sequelize.STRING(30),
                allowNull: true,
            },
            player_brawler_id: {
                type: Sequelize.STRING(8),
                allowNull: true,
            },
            player_brawler_power: {
                type: Sequelize.STRING(2),
                allowNull: true,
            },
            player_brawler_trophy : {
                type: Sequelize.SMALLINT,
                allowNull: true,
            },
        }, {
            sequelize,
            timestamps: false,
            underscore: false,
            modelName: 'BattleLog',
            tableName: 'battle_log',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
        });
    }

    static associate(db) {
        db.BattleLog.belongsTo(db.Rotation, {
            foreignKey: 'map_id', targetKey: 'id'
        });

        db.BattleLog.belongsTo(db.Member, {
            foreignKey: 'member_id', targetKey: 'id'
        });
    }
}