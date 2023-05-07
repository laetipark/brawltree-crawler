import Sequelize from "sequelize";

export default class MapRotation extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            slot_id: {
                type: Sequelize.STRING(2),
                primaryKey: true,
                allowNull: true,
            },
            map_id: {
                type: Sequelize.STRING(8),
                primaryKey: true,
                allowNull: true,
            },
            begin_time: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            end_time: {
                type: Sequelize.DATE,
                allowNull: true,
            }
        }, {
            sequelize,
            timestamps: false,
            underscore: false,
            modelName: 'MapRotation',
            tableName: 'map_rotation',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
        });
    }

    static associate(db) {
        db.MapRotation.belongsTo(db.Map, {
            foreignKey: 'map_id', sourceKey: 'id'
        });
    }
}