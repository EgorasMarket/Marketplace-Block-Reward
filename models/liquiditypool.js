'use strict';
module.exports = (sequelize, DataTypes) => {
  const LiquidityPool = sequelize.define('LiquidityPool', {
    email: DataTypes.STRING,
    tokenA: DataTypes.DECIMAL,
    tokenB: DataTypes.DECIMAL,
    tokenASymbol: DataTypes.STRING,
    tokenBSymbol: DataTypes.STRING
  }, {});
  LiquidityPool.associate = function(models) {
    // associations can be defined here
  };
  return LiquidityPool;
};