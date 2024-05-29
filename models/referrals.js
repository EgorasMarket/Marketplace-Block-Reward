"use strict";
module.exports = (sequelize, DataTypes) => {
  const Referral = sequelize.define(
    "Referral",
    {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4(),
      },
      userId: DataTypes.STRING,
      username: DataTypes.STRING,
      refererId: DataTypes.STRING,
      status: {
        type: DataTypes.ENUM("ACTIVE", "INACTIVE"),
        defaultValue: "INACTIVE",
      },
      amount: DataTypes.DECIMAL(65, 30),
      //   transactionHash: DataTypes.STRING,
    },
    {}
  );
  Referral.associate = function (models) {
    // associations can be defined here
  };
  return Referral;
};
