"use strict";
module.exports = (sequelize, DataTypes) => {
  const Stake = sequelize.define("Stake", {
    stake_id: {
      allowNull: false,
      type: DataTypes.UUID(),
      defaultValue: DataTypes.UUIDV4(),
      primaryKey: true,
    },
    user_id: DataTypes.STRING,
    token_id: DataTypes.STRING,
    amount_staked: DataTypes.DECIMAL,
    start_date: DataTypes.DATE,
    end_date: DataTypes.DATE,
    rewards_earned: DataTypes.DECIMAL,
    nft_id: {
      type: DataTypes.STRING(2000),
      allowNull: true,
    },
    purchase_val: {
      type: DataTypes.DECIMAL(10),
      allowNull: false,
    },
  });
  Stake.associate = function (models) {
    // associations can be defined here
  };
  return Stake;
};
