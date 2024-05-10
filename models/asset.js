"use strict";
module.exports = (sequelize, DataTypes) => {
  const Asset = sequelize.define(
    "Asset",
    {
      symbol: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
      },
      blockchain: {
        type: DataTypes.ENUM,
        values: ["ETHEREUM", "BITCOIN", "BINANCE", "EGOCHAIN"],
        allowNull: false,
      },
      contract: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      about: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      image: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      coinID: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isBase: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      networks: {
        type: DataTypes.JSON,
        allowNull: false,
      },

      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      has_cashout: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      addedBy: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {}
  );
  Asset.associate = function (models) {
    // associations can be defined here
  };
  return Asset;
};
