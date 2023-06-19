import Sequelize from "sequelize";

export default class MemberRecord extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            MEMBER_ID: {
                type: Sequelize.STRING(12),
                primaryKey: true,
                allowNull: false,
            },
            MAP_MD: {
                type: Sequelize.CHAR(12),
                primaryKey: true,
                allowNull: false,
            },
            MATCH_TYP: {
                type: Sequelize.TINYINT,
                primaryKey: true,
                allowNull: false,
            },
            MATCH_GRD: {
                type: Sequelize.TINYINT,
                primaryKey: true,
                allowNull: false,
            },
            MATCH_CHG: {
                type: Sequelize.SMALLINT,
                allowNull: false,
            },
            MATCH_CNT: {
                type: Sequelize.SMALLINT,
                allowNull: true,
            },
            MATCH_CNT_VIC: {
                type: Sequelize.SMALLINT,
                allowNull: true,
            },
            MATCH_CNT_DEF: {
                type: Sequelize.SMALLINT,
                allowNull: true,
            },
        }, {
            sequelize,
            timestamps: false,
            underscore: false,
            modelName: 'MemberRecord',
            tableName: 'TB_MEMBER_RECORD',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
        });
    }

    static associate(db) {
        db.MemberRecord.belongsTo(db.Member, {
            foreignKey: 'MEMBER_ID', targetKey: 'MEMBER_ID'
        });
    }
}