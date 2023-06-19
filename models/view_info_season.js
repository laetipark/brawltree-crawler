import Sequelize from "sequelize";

export default class InfoSeason extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            SEASON_NO: {
                type: Sequelize.TINYINT.UNSIGNED,
                primaryKey: true,
                allowNull: false,
            },
            SEASON_BGN_DT: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            SEASON_END_DT: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        }, {
            sequelize,
            timestamps: false,
            underscore: false,
            modelName: 'InfoSeason',
            tableName: 'V_INFO_SEASON',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
        });
    }
}