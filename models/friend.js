import Sequelize from "sequelize";

export default class Friend extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            member_id: {
                type: Sequelize.STRING(12),
                allowNull: false,
            },
            friend_id: {
                type: Sequelize.STRING(12),
                allowNull: false,
            },
            friend_name: {
                type: Sequelize.STRING(30),
                allowNull: false,
            },
            map_mode: {
                type: Sequelize.STRING(20),
                allowNull: false,
            },
            match_type: {
                type: Sequelize.STRING(1),
                allowNull: false,
            },
            match_grade: {
                type: Sequelize.STRING(2),
                allowNull: false,
            },
            match_count: {
                type: Sequelize.SMALLINT,
                allowNull: true,
            },
            victory_count: {
                type: Sequelize.SMALLINT,
                allowNull: true,
            },
            point: {
                type: Sequelize.FLOAT,
                allowNull: true,
            },
        }, {
            sequelize,
            timestamps: false,
            underscore: false,
            modelName: 'Friend',
            tableName: 'friend',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
        });
    }

    static associate(db) {
    }
}