import Sequelize from "sequelize";

export default class BattlePick extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            MAP_ID: {
                type: Sequelize.CHAR(8),
                primaryKey: true,
                allowNull: false,
            },
            BRAWLER_ID: {
                type: Sequelize.CHAR(8),
                primaryKey: true,
                allowNull: false,
            },
            MATCH_TYP: {
                type: Sequelize.TINYINT,
                allowNull: false,
            },
            MATCH_GRD: {
                type: Sequelize.TINYINT,
                allowNull: false,
            },
            MAP_MD: {
                type: Sequelize.STRING(12),
                allowNull: false,
            },
            MATCH_CNT: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            MATCH_CNT_VIC: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            MATCH_CNT_DEF: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
        }, {
            sequelize,
            timestamps: false,
            underscore: false,
            modelName: 'BattlePick',
            tableName: 'V_BATTLE_PICK',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
        });
    }
}