'use strict';
module.exports = (sequelize, DataTypes) => {
  const PriceOracle = sequelize.define('PriceOracle', {
    ids: DataTypes.STRING,
    vs_currencies: DataTypes.STRING,
    include_market_cap: DataTypes.STRING,
    include_24hr_vol: DataTypes.STRING,
    include_24hr_change: DataTypes.STRING,
    include_last_updated_at: DataTypes.STRING,
    price: DataTypes.STRING
  }, {});
  PriceOracle.associate = function(models) {
    // associations can be defined here
  };
  return PriceOracle;
};