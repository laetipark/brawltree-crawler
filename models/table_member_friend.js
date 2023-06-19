import Sequelize from "sequelize";

export default class MemberFriend extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            MEMBER_ID: {
                type: Sequelize.STRING(12),
                primaryKey: true,
                allowNull: false,
            },
            FRIEND_ID: {
                type: Sequelize.STRING(12),
                primaryKey: true,
                allowNull: false,
            },
            MAP_MD: {
                type: Sequelize.STRING(20),
                primaryKey: true,
                allowNull: false,
            },
            MATCH_TYP: {
                type: Sequelize.TINYINT,
                primaryKey: true,
                allowNull: true,
            },
            MATCH_GRD: {
                type: Sequelize.TINYINT,
                primaryKey: true,
                allowNull: true,
            },
            FRIEND_NM: {
                type: Sequelize.STRING(30),
                allowNull: false,
            },
            FRIEND_PT: {
                type: Sequelize.FLOAT,
                allowNull: true,
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
            modelName: 'MemberFriend',
            tableName: 'TB_MEMBER_FRIEND',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
        });
    }

    static associate(db) {
        db.MemberFriend.belongsTo(db.Member, {
            foreignKey: 'MEMBER_ID', targetKey: 'MEMBER_ID'
        });
    }
}