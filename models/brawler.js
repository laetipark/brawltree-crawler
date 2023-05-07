import Sequelize from "sequelize";

export default class Brawler extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            name: {
                type: Sequelize.STRING(20),
                allowNull: false,
            },
            rarity: {
                type: Sequelize.STRING(20),
                allowNull: true,
            },
            class: {
                type: Sequelize.STRING(20),
                allowNull: true,
            },
            gender: {
                type: Sequelize.STRING(10),
                allowNull: true,
            },
            icon: {
                type: Sequelize.STRING(40),
                allowNull: true,
            },
        }, {
            sequelize,
            timestamps: false,
            underscore: false,
            modelName: 'Brawler',
            tableName: 'brawler',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
        });
    }

    static associate(db) {
        db.Brawler.hasMany(db.MemberBrawler, {
            foreignKey: 'brawler_id', sourceKey: 'id'
        });
    }
}