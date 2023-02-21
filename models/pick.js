import Sequelize from "sequelize";

export default class Pick extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            map_id: {
                type: Sequelize.STRING(8),
                allowNull: false,
            },
            brawler_id: {
                type: Sequelize.STRING(8),
                allowNull: true,
            },
            battle_type: {
                type: Sequelize.STRING(1),
                allowNull: true,
            },
            match: {
                type: Sequelize.SMALLINT,
                allowNull: true,
            },
            win: {
                type: Sequelize.SMALLINT,
                allowNull: true,
            },
        }, {
            sequelize,
            timestamps: false,
            underscore: false,
            modelName: 'Pick',
            tableName: 'pick',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
        });
    }

    static associate(db) {
    }
}