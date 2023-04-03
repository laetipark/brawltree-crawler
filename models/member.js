import Sequelize from "sequelize";

export default class Member extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            name: {
                type: Sequelize.STRING(30),
                allowNull: false,
            },
            trophy_current: {
                type: Sequelize.SMALLINT.UNSIGNED,
                allowNull: false,
            },
            trophy_highest: {
                type: Sequelize.SMALLINT.UNSIGNED,
                allowNull: false,
            },
            victory_triple: {
                type: Sequelize.SMALLINT.UNSIGNED,
                allowNull: true,
            },
            victory_duo: {
                type: Sequelize.SMALLINT.UNSIGNED,
                allowNull: true,
            },
            rank_25: {
                type: Sequelize.SMALLINT.UNSIGNED,
                allowNull: true,
            },
            rank_30: {
                type: Sequelize.SMALLINT.UNSIGNED,
                allowNull: true,
            },
            rank_35: {
                type: Sequelize.SMALLINT.UNSIGNED,
                allowNull: true,
            },
            league_solo_current: {
                type: Sequelize.STRING(2),
                allowNull: true,
            },
            league_solo_highest: {
                type: Sequelize.STRING(2),
                allowNull: true,
            },
            league_team_current: {
                type: Sequelize.STRING(2),
                allowNull: true,
            },
            league_team_highest: {
                type: Sequelize.STRING(2),
                allowNull: true,
            },
            club_tag: {
                type: Sequelize.STRING(12),
                allowNull: false,
            },
            profile_picture: {
                type: Sequelize.CHAR(8),
                allowNull: false,
            },
        }, {
            sequelize,
            timestamps: false,
            underscore: false,
            modelName: 'Member',
            tableName: 'member',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
        });
    }

    static associate(db) {
        db.Member.hasMany(db.Battle, {
            foreignKey: 'member_id', sourceKey: 'id'
        });

        db.Member.hasMany(db.Record, {
            foreignKey: 'member_id', sourceKey: 'id'
        });

        db.Member.hasMany(db.Friend, {
            foreignKey: 'member_id', sourceKey: 'id'
        });

        db.Member.hasMany(db.MemberBrawler, {
            foreignKey: 'member_id', sourceKey: 'id'
        });
    }
}