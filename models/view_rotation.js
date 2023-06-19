import Sequelize from "sequelize";

export default class Rotation extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            ROTATION_SLT_NO: {
                type: Sequelize.TINYINT,
                primaryKey: true,
                allowNull: false,
            },
            ROTATION_BGN_DT: {
                type: Sequelize.DATE,
                primaryKey: true,
                allowNull: false,
            },
            ROTATION_END_DT: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            MAP_ID: {
                type: Sequelize.CHAR(8),
                allowNull: false,
            },
            MAP_MDFS: {
                type: Sequelize.STRING(50),
                allowNull: true,
            }
        }, {
            sequelize,
            timestamps: false,
            underscore: false,
            modelName: 'Rotation',
            tableName: 'V_ROTATION',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
        });
    }

    static associate(db) {
        db.Rotation.belongsTo(db.InfoMap, {
            foreignKey: 'MAP_ID', sourceKey: 'MAP_ID'
        });
    }
}