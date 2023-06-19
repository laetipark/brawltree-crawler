import Sequelize from "sequelize";

export default class MemberBrawler extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            MEMBER_ID: {
                type: Sequelize.STRING(12),
                primaryKey: true,
                allowNull: false,
            },
            BRAWLER_ID: {
                type: Sequelize.CHAR(8),
                primaryKey: true,
                allowNull: false,
            },
            BRAWLER_PWR: {
                type: Sequelize.TINYINT,
                allowNull: false,
            },
            TROPHY_BGN: {
                type: Sequelize.SMALLINT,
                allowNull: true,
            },
            TROPHY_CUR: {
                type: Sequelize.SMALLINT,
                allowNull: false,
            },
            TROPHY_HGH: {
                type: Sequelize.SMALLINT,
                allowNull: false,
            },
            TROPHY_RNK: {
                type: Sequelize.STRING(2),
                allowNull: false,
            },
            MATCH_CNT_TL: {
                type: Sequelize.SMALLINT,
                allowNull: true,
            },
            MATCH_CNT_PL: {
                type: Sequelize.SMALLINT,
                allowNull: true,
            },
            MATCH_CNT_VIC_TL: {
                type: Sequelize.SMALLINT,
                allowNull: true,
            },
            MATCH_CNT_VIC_PL: {
                type: Sequelize.SMALLINT,
                allowNull: true,
            },
            MATCH_CNT_DEF_TL: {
                type: Sequelize.SMALLINT,
                allowNull: true,
            },
            MATCH_CNT_DEF_PL: {
                type: Sequelize.SMALLINT,
                allowNull: true,
            },
        }, {
            sequelize,
            timestamps: false,
            underscore: false,
            modelName: 'MemberBrawler',
            tableName: 'TB_MEMBER_BRAWLER',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
        });
    }

    static associate(db) {
        db.MemberBrawler.belongsTo(db.Member, {
            foreignKey: 'MEMBER_ID', targetKey: 'MEMBER_ID'
        });

        db.MemberBrawler.belongsTo(db.InfoBrawler, {
            foreignKey: 'BRAWLER_ID', targetKey: 'BRAWLER_ID'
        });
    }
}