import Sequelize from "sequelize";

export default class Rotation extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            mode: {
                type: Sequelize.STRING(12),
                allowNull: false,
            },
            name: {
                type: Sequelize.STRING(30),
                allowNull: false,
            },
            start_time: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            end_time: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            slot: {
                type: Sequelize.STRING(2),
                allowNull: true,
            },
            image: {
                type: Sequelize.STRING(30),
                allowNull: true,
            },
        }, {
            sequelize,
            timestamps: false,
            underscore: false,
            modelName: 'Rotation',
            tableName: 'rotation',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
        });
    }

    static associate(db) {
        db.Rotation.hasMany(db.BattleLog, {
            foreignKey: 'map_id', sourceKey: 'id'
        });
    }
}