"use strict";
module.exports = (sequelize, DataTypes) => {
  const Watu = sequelize.define(
    "Watu",
    {
      account_id: DataTypes.STRING,
      account_name: DataTypes.STRING,
      email: DataTypes.STRING,
      bank: DataTypes.JSON,
    },
    {}
  );
  Watu.associate = function (models) {
    // associations can be defined here
  };
  return Watu;
};
