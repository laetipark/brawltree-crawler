import Sequelize from "sequelize";

export default class Season extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            start_date: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            end_date: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        }, {
            sequelize,
            timestamps: false,
            underscore: false,
            modelName: 'Season',
            tableName: 'season',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
        });
    }

    static associate(db) {
    }
}