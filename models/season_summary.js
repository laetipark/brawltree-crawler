import Sequelize from "sequelize";

export default class SeasonSummary extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            season_id: {
                type: Sequelize.STRING(2),
                primaryKey: true,
                allowNull: false,
            },
            member_id: {
                type: Sequelize.STRING(12),
                primaryKey: true,
                allowNull: false,
            },
            match_type: {
                type: Sequelize.CHAR(1),
                allowNull: false,
            },
            map_mode: {
                type: Sequelize.CHAR(12),
                allowNull: false,
            },
            member_name: {
                type: Sequelize.STRING(30),
                allowNull: false,
            },
            match_count: {
                type: Sequelize.SMALLINT,
                allowNull: true,
            },
            match_change: {
                type: Sequelize.SMALLINT,
                allowNull: false,
            },
            point: {
                type: Sequelize.FLOAT,
                allowNull: true,
            },
        }, {
            sequelize,
            timestamps: false,
            underscore: false,
            modelName: 'SeasonSummary',
            tableName: 'season_summary',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
        });
    }

    static associate(db) {
    }
}