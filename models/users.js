export default (sequelize, DataTypes) => {
  const Users = sequelize.define(
    'Users',
    {
      USER_ID: {
        type: DataTypes.STRING(12),
        primaryKey: true,
        allowNull: false,
      },
      USER_LST_BT: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      USER_CR: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      USER_CR_NM: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      CYCLE_NO: {
        type: DataTypes.TINYINT,
        allowNull: true,
      },
    },
    {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      tableName: 'USERS',
      timestamps: true,
      paranoid: true,
      createdAt: 'CREATED_AT',
      updatedAt: 'UPDATED_AT',
      deletedAt: 'DELETED_AT',
    },
  );

  Users.associate = (models) => {
    Users.hasOne(models.UserProfile, {
      foreignKey: 'USER_ID',
      sourceKey: 'USER_ID',
    });

    Users.hasMany(models.UserBattles, {
      foreignKey: 'USER_ID',
      sourceKey: 'USER_ID',
    });

    Users.hasMany(models.UserBrawlers, {
      foreignKey: 'USER_ID',
      sourceKey: 'USER_ID',
    });

    Users.hasMany(models.UserRecords, {
      foreignKey: 'USER_ID',
      sourceKey: 'USER_ID',
    });

    Users.hasMany(models.UserFriends, {
      foreignKey: 'USER_ID',
      sourceKey: 'USER_ID',
    });
  };

  return Users;
};
