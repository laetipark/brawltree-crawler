import Sequelize from "sequelize";

export default class BattleLog extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            member_id: {
                type: Sequelize.STRING(12),
                allowNull: false,
            },
            match_date: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            match_duration: {
                type: Sequelize.SMALLINT,
                allowNull: true,
            },
            map_id: {
                type: Sequelize.STRING(8),
                allowNull: false,
            },
            match_type: {
                type: Sequelize.STRING(2),
                allowNull: false,
            },
            match_mode: {
                type: Sequelize.STRING(1),
                allowNull: false,
            },
            match_rank: {
                type: Sequelize.STRING(2),
                allowNull: true,
            },
            match_result: {
                type: Sequelize.STRING(1),
                allowNull: false,
            },
            match_grade: {
                type: Sequelize.STRING(2),
                allowNull: false,
            },
            match_change: {
                type: Sequelize.TINYINT,
                allowNull: false,
            },
            player_id: {
                type: Sequelize.STRING(12),
                allowNull: false,
            },
            player_name: {
                type: Sequelize.STRING(30),
                allowNull: false,
            },
            player_team: {
                type: Sequelize.STRING(1),
                allowNull: false,
            },
            player_star_player: {
                type: Sequelize.STRING(1),
                allowNull: false,
            },
            brawler_id: {
                type: Sequelize.STRING(8),
                allowNull: false,
            },
            brawler_power: {
                type: Sequelize.STRING(2),
                allowNull: false,
            },
            brawler_trophy: {
                type: Sequelize.SMALLINT,
                allowNull: false,
            },
            raw_type: {
                type: Sequelize.STRING(2),
                allowNull: false,
            },
            raw_change: {
                type: Sequelize.TINYINT,
                allowNull: true,
            },
        }, {
            sequelize,
            timestamps: false,
            underscore: false,
            modelName: 'Battle',
            tableName: 'battle',
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