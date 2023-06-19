import Sequelize from "sequelize";

export default class Battle extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            MEMBER_ID: {
                type: Sequelize.STRING(12),
                primaryKey: true,
                allowNull: false,
            },
            PLAYER_ID: {
                type: Sequelize.STRING(12),
                primaryKey: true,
                allowNull: false,
            },
            BRAWLER_ID: {
                type: Sequelize.CHAR(8),
                primaryKey: true,
                allowNull: false,
            },
            MATCH_DT: {
                type: Sequelize.DATE,
                primaryKey: true,
                allowNull: false,
            },
            MAP_ID: {
                type: Sequelize.CHAR(8),
                allowNull: false,
            },
            MAP_MD_CD: {
                type: Sequelize.TINYINT,
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
            MATCH_DUR: {
                type: Sequelize.TINYINT.UNSIGNED,
                allowNull: true,
            },
            MATCH_RNK: {
                type: Sequelize.TINYINT,
                allowNull: true,
            },
            MATCH_RES: {
                type: Sequelize.TINYINT,
                allowNull: false,
            },
            MATCH_CHG: {
                type: Sequelize.TINYINT,
                allowNull: false,
            },
            PLAYER_NM: {
                type: Sequelize.STRING(30),
                allowNull: false,
            },
            PLAYER_TM_NO: {
                type: Sequelize.TINYINT,
                allowNull: false,
            },
            PLAYER_SP_BOOL: {
                type: Sequelize.BOOLEAN,
                allowNull: true,
            },
            BRAWLER_PWR: {
                type: Sequelize.TINYINT,
                allowNull: false,
            },
            BRAWLER_TRP: {
                type: Sequelize.SMALLINT,
                allowNull: false,
            },
            RAW_TYP: {
                type: Sequelize.TINYINT,
                allowNull: false,
            },
            RAW_CHG: {
                type: Sequelize.TINYINT,
                allowNull: true,
            },
        }, {
            sequelize,
            timestamps: false,
            underscore: false,
            modelName: 'Battle',
            tableName: 'TB_BATTLE',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
        });
    }

    static associate(db) {
        db.Battle.belongsTo(db.InfoMap, {
            foreignKey: 'MAP_ID', targetKey: 'MAP_ID'
        });

        db.Battle.belongsTo(db.Member, {
            foreignKey: 'MEMBER_ID', targetKey: 'MEMBER_ID'
        });
    }
}