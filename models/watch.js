"use strict";
module.exports = (sequelize, DataTypes) => {
  const Watch = sequelize.define(
    "Watch",
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
  Watch.associate = function (models) {
    // associations can be defined here
  };
  return Watch;
};
