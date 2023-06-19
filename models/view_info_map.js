import Sequelize from "sequelize";

export default class InfoMap extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            MAP_ID: {
                type: Sequelize.CHAR(8),
                primaryKey: true,
                allowNull: false,
            },
            MAP_MD: {
                type: Sequelize.STRING(12),
                allowNull: false,
            },
            MAP_NM: {
                type: Sequelize.STRING(30),
                allowNull: false,
            },
            ROTATION_TL_BOOL: {
                type: Sequelize.BOOLEAN,
                allowNull: true,
            },
            ROTATION_PL_BOOL: {
                type: Sequelize.BOOLEAN,
                allowNull: true,
            }
        }, {
            sequelize,
            timestamps: false,
            underscore: false,
            modelName: 'InfoMap',
            tableName: 'V_INFO_MAP',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
        });
    }

    static associate(db) {
        db.InfoMap.hasMany(db.Battle, {
            foreignKey: 'MAP_ID', sourceKey: 'MAP_ID'
        });

        db.InfoMap.hasMany(db.Rotation, {
            foreignKey: 'MAP_ID', sourceKey: 'MAP_ID'
        });
    }
}