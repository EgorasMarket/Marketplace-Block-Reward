"use strict";
module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    "Notification",
    {
      email: DataTypes.STRING,
      meta: DataTypes.JSON,
      tunnel: {
        type: DataTypes.ENUM("USER", "ADMIN"),
        defaultValue: "USER",
      },
      notified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {}
  );
  Notification.associate = function (models) {
    // associations can be defined here
  };
  return Notification;
};
