"use strict";
module.exports = (sequelize, DataTypes) => {
  const LiquidityPoolBalance = sequelize.define(
    "LiquidityPoolBalance",
    {
      tokenA: DataTypes.DECIMAL,
      tokenB: DataTypes.DECIMAL,
      tokenASymbol: DataTypes.STRING,
      tokenBSymbol: DataTypes.STRING,
    },
    {}
  );
  LiquidityPoolBalance.associate = function (models) {
    // associations can be defined here
  };
  return LiquidityPoolBalance;
};
