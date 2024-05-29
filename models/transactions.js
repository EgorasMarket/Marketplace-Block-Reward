"use strict";
module.exports = (sequelize, DataTypes) => {
  const Transactions = sequelize.define(
    "Transactions",
    // hello
    {
      email: DataTypes.STRING,
      to_email: DataTypes.STRING,
      meta: DataTypes.JSON,
      amount: DataTypes.DECIMAL(65, 30),
      type: {
        type: DataTypes.ENUM(
          "WIITHDRAWAL",
          "DEPOSIT",
          "CASHOUT",
          "INTERNAL",
          "PURCHASE",
          "SWAP",
          "ADDLIQUIDITY",
          "REMOVELIQUIDITY",
          "SUBSCRIPTION",
          "SUBSCRIPTION_REWARD",
          "NFT-CREDIT",
          "NFT-DEBIT"
        ),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("SUCCESS", "FAILED", "PENDING", "ADMIN_APPROVED"),
        allowNull: false,
      },
      approved_by: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "N/A",
      },
      origin: {
        type: DataTypes.ENUM("DEFAULT", "CEX", "EGORAS"),
        defaultValue: "DEFAULT",
        // allowNull: false,
      },
    },
    {}
  );
  Transactions.associate = function (models) {
    // associations can be defined here
  };
  return Transactions;
};

// ALTER TABLE `Transactions` ADD `origin` ENUM('DEFAULT','CEX','EGORAS') NOT NULL DEFAULT 'DEFAULT' AFTER `approved_by`;
