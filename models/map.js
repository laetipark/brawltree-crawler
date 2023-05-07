import Sequelize from "sequelize";

export default class Map extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            mode: {
                type: Sequelize.STRING(12),
                allowNull: false,
            },
            name: {
                type: Sequelize.STRING(30),
                allowNull: false,
            }
        }, {
            sequelize,
            timestamps: false,
            underscore: false,
            modelName: 'Map',
            tableName: 'map',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
        });
    }

    static associate(db) {
        db.Map.hasMany(db.Battle, {
            foreignKey: 'map_id', sourceKey: 'id'
        });

        db.Map.hasMany(db.MapRotation, {
            foreignKey: 'map_id', sourceKey: 'id'
        });
    }
}