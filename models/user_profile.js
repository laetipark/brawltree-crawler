export default (sequelize, DataTypes) => {
  const UserProfile = sequelize.define(
    'UserProfile',
    {
      USER_ID: {
        type: DataTypes.STRING(12),
        primaryKey: true,
        allowNull: false,
      },
      USER_NM: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      USER_PRFL: {
        type: DataTypes.CHAR(8),
        allowNull: false,
      },
      CLUB_ID: {
        type: DataTypes.STRING(12),
        allowNull: true,
      },
      CLUB_NM: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      TROPHY_CUR: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      TROPHY_HGH: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      VICTORY_TRP: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      VICTORY_DUO: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      BRAWLER_RNK_25: {
        type: DataTypes.SMALLINT.UNSIGNED,
        allowNull: false,
      },
      BRAWLER_RNK_30: {
        type: DataTypes.SMALLINT.UNSIGNED,
        allowNull: false,
      },
      BRAWLER_RNK_35: {
        type: DataTypes.SMALLINT.UNSIGNED,
        allowNull: false,
      },
      PL_SL_CUR: {
        type: DataTypes.TINYINT,
        allowNull: false,
      },
      PL_SL_HGH: {
        type: DataTypes.TINYINT,
        allowNull: false,
      },
      PL_TM_CUR: {
        type: DataTypes.TINYINT,
        allowNull: false,
      },
      PL_TM_HGH: {
        type: DataTypes.TINYINT,
        allowNull: false,
      },
    },
    {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      tableName: 'USER_PROFILE',
      timestamps: true,
      paranoid: true,
      createdAt: 'CREATED_AT',
      updatedAt: 'UPDATED_AT',
      deletedAt: 'DELETED_AT',
    },
  );

  UserProfile.associate = (models) => {
    UserProfile.belongsTo(models.Users, {
      foreignKey: 'USER_ID',
      sourceKey: 'USER_ID',
    });

    UserProfile.hasMany(models.UserBattles, {
      foreignKey: 'USER_ID',
      sourceKey: 'USER_ID',
    });

    UserProfile.hasMany(models.UserBrawlers, {
      foreignKey: 'USER_ID',
      sourceKey: 'USER_ID',
    });

    UserProfile.hasMany(models.UserFriends, {
      foreignKey: 'USER_ID',
      sourceKey: 'USER_ID',
    });

    UserProfile.hasMany(models.UserFriends, {
      foreignKey: 'FRIEND_ID',
      sourceKey: 'USER_ID',
    });

    UserProfile.hasMany(models.UserRecords, {
      foreignKey: 'USER_ID',
      sourceKey: 'USER_ID',
    });
  };

  return UserProfile;
};
