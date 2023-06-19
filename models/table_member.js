import Sequelize from "sequelize";

export default class Member extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            MEMBER_ID: {
                type: Sequelize.STRING(12),
                primaryKey: true,
                allowNull: false,
            },
            MEMBER_NM: {
                type: Sequelize.STRING(30),
                allowNull: false,
            },
            MEMBER_PROFILE: {
                type: Sequelize.CHAR(8),
                allowNull: false,
            },
            TROPHY_CUR: {
                type: Sequelize.INTEGER.UNSIGNED,
                allowNull: false,
            },
            TROPHY_HGH: {
                type: Sequelize.INTEGER.UNSIGNED,
                allowNull: false,
            },
            VICTORY_TRP: {
                type: Sequelize.INTEGER.UNSIGNED,
                allowNull: true,
            },
            VICTORY_DUO: {
                type: Sequelize.INTEGER.UNSIGNED,
                allowNull: true,
            },
            BRAWLER_RNK_25: {
                type: Sequelize.TINYINT.UNSIGNED,
                allowNull: true,
            },
            BRAWLER_RNK_30: {
                type: Sequelize.TINYINT.UNSIGNED,
                allowNull: true,
            },
            BRAWLER_RNK_35: {
                type: Sequelize.TINYINT.UNSIGNED,
                allowNull: true,
            },
            PL_SL_CUR: {
                type: Sequelize.TINYINT,
                allowNull: true,
            },
            PL_SL_HGH: {
                type: Sequelize.TINYINT,
                allowNull: true,
            },
            PL_TM_CUR: {
                type: Sequelize.TINYINT,
                allowNull: true,
            },
            PL_TM_HGH: {
                type: Sequelize.TINYINT,
                allowNull: true,
            },
            CLUB_ID: {
                type: Sequelize.STRING(12),
                allowNull: true,
            },
        }, {
            sequelize,
            timestamps: false,
            underscore: false,
            modelName: 'Member',
            tableName: 'TB_MEMBER',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
        });
    }

    static associate(db) {
        db.Member.hasMany(db.Battle, {
            foreignKey: 'MEMBER_ID', sourceKey: 'MEMBER_ID'
        });

        db.Member.hasMany(db.MemberRecord, {
            foreignKey: 'MEMBER_ID', sourceKey: 'MEMBER_ID'
        });

        db.Member.hasMany(db.MemberFriend, {
            foreignKey: 'MEMBER_ID', sourceKey: 'MEMBER_ID'
        });

        db.Member.hasMany(db.MemberBrawler, {
            foreignKey: 'MEMBER_ID', sourceKey: 'MEMBER_ID'
        });
    }
}