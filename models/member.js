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
                type: Sequelize.SMALLINT,
                allowNull: true,
            },
            league_solo_highest: {
                type: Sequelize.SMALLINT,
                allowNull: true,
            },
            league_team_current: {
                type: Sequelize.SMALLINT,
                allowNull: true,
            },
            league_team_highest: {
                type: Sequelize.SMALLINT,
                allowNull: true,
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
        db.Member.hasMany(db.BattleLog, {
            foreignKey: 'member_id', sourceKey: 'id'
        });
    }
}