"use strict";
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      firstName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lastName: {
        type: DataTypes.STRING,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
      },
      phone: {
        type: DataTypes.STRING,
      },
      username: {
        type: DataTypes.STRING,
      },
      referral: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "N/A",
      },
      swapRef: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      gender: {
        type: DataTypes.ENUM("Male", "Female"),
        allowNull: true,
      },
      dateOfBirth: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      countrycode: {
        type: DataTypes.STRING,
      },
      profilePic: {
        type: DataTypes.STRING,
      },
      isAdmin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      smsOtp: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      verifyToken: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      emailId: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      verifyEmail: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      has2fa: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      wallet_address: {
        type: DataTypes.STRING,
        defaultValue: "n/a",
      },

      user_pin: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
    },
    {
      defaultScope: {
        attributes: { exclude: ["password", "verifyToken", "isAdmin"] },
      },
      scopes: {
        withSecretColumns: {
          attributes: { include: ["password", "verifyToken", "isAdmin"] },
        },
      },
    }
  );
  User.associate = function (models) {
    // associations can be defined here
  };
  return User;
};
