import Sequelize from "sequelize";

export default class InfoBrawler extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            BRAWLER_ID: {
                type: Sequelize.CHAR(8),
                primaryKey: true,
                allowNull: false,
            },
            BRAWLER_NM: {
                type: Sequelize.STRING(20),
                allowNull: false,
            },
            BRAWLER_RRT: {
                type: Sequelize.STRING(20),
                allowNull: true,
            },
            BRAWLER_CL: {
                type: Sequelize.STRING(20),
                allowNull: true,
            },
            BRAWLER_GNDR: {
                type: Sequelize.STRING(10),
                allowNull: true,
            },
            BRAWLER_ICN: {
                type: Sequelize.STRING(40),
                allowNull: true,
            },
        }, {
            sequelize,
            timestamps: false,
            underscore: false,
            modelName: 'InfoBrawler',
            tableName: 'V_INFO_BRAWLER',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
        });
    }

    static associate(db) {
        db.InfoBrawler.hasMany(db.MemberBrawler, {
            foreignKey: 'BRAWLER_ID', sourceKey: 'BRAWLER_ID'
        });
    }
}