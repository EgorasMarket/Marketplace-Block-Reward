"use strict";
module.exports = (sequelize, DataTypes) => {
  const EgoWatch = sequelize.define(
    "EgoWatch",
    {
      symbol: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      block: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {}
  );
  EgoWatch.associate = function (models) {
    // associations can be defined here
  };
  return EgoWatch;
};
