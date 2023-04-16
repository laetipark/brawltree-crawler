import Sequelize from "sequelize";

export default class MemberBrawler extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            member_id: {
                type: Sequelize.STRING(12),
                primaryKey: true,
                allowNull: true,
            },
            brawler_id: {
                type: Sequelize.CHAR(8),
                primaryKey: true,
                allowNull: true,
            },
            power: {
                type: Sequelize.STRING(2),
                allowNull: true,
            },
            trophy_begin: {
                type: Sequelize.SMALLINT,
                allowNull: true,
            },
            trophy_current: {
                type: Sequelize.SMALLINT,
                allowNull: false,
            },
            trophy_highest: {
                type: Sequelize.SMALLINT,
                allowNull: false,
            },
            trophy_rank: {
                type: Sequelize.STRING(2),
                allowNull: false,
            },
            match_trophy: {
                type: Sequelize.SMALLINT,
                allowNull: true,
            },
            match_league: {
                type: Sequelize.SMALLINT,
                allowNull: true,
            },
            victory_trophy: {
                type: Sequelize.SMALLINT,
                allowNull: true,
            },
            victory_league: {
                type: Sequelize.SMALLINT,
                allowNull: true,
            },
            defeat_trophy: {
                type: Sequelize.SMALLINT,
                allowNull: true,
            },
            defeat_league: {
                type: Sequelize.SMALLINT,
                allowNull: true,
            },
        }, {
            sequelize,
            timestamps: false,
            underscore: false,
            modelName: 'MemberBrawler',
            tableName: 'member_brawler',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
        });
    }

    static associate(db) {
        db.MemberBrawler.belongsTo(db.Member, {
            foreignKey: 'member_id', targetKey: 'id'
        });

        db.MemberBrawler.belongsTo(db.Brawler, {
            foreignKey: 'brawler_id', targetKey: 'id'
        });
    }
}