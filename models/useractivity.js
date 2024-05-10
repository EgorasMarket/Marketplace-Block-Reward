"use strict";

const { number } = require("joi");

module.exports = (sequelize, DataTypes) => {
  const userActivity = sequelize.define(
    "userActivity",
    {
      id: {
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER,
      },
      status: {
        type: DataTypes.ENUM("FAILURE", "SUCCESS"),
        defaultValue: "FAILURE",
      },
      message: DataTypes.STRING,
      call_type: DataTypes.STRING,
      user_email: DataTypes.STRING,
      tunnel: {
        type: DataTypes.ENUM("USER", "ADMIN"),
        defaultValue: "USER",
      },
    },
    {}
  );
  userActivity.associate = function (models) {
    // associations can be defined here
  };
  return userActivity;
};
