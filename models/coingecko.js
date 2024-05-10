// 'use strict';
module.exports = (sequelize, DataTypes) => {
  const Coingecko = sequelize.define('Coingecko', {
    cid: DataTypes.STRING,
    symbol: DataTypes.STRING,
    name: DataTypes.STRING,
    image: DataTypes.STRING,
    current_price: DataTypes.DECIMAL,
    market_cap: DataTypes.DECIMAL,
    market_cap_rank: DataTypes.DECIMAL,
    fully_diluted_valuation: DataTypes.DECIMAL,
    total_volume: DataTypes.DECIMAL,
    high_24h: DataTypes.DECIMAL,
    low_24h: DataTypes.DECIMAL,
    price_change_24h: DataTypes.DECIMAL,
    price_change_percentage_24h: DataTypes.DECIMAL,
    market_cap_change_24h: DataTypes.DECIMAL,
    market_cap_change_percentage_24h: DataTypes.DECIMAL,
    circulating_supply: DataTypes.DECIMAL,
    total_supply: DataTypes.DECIMAL,
    max_supply: DataTypes.DECIMAL,
    sparkline_in_7d: DataTypes.JSON,
    price_change_percentage_1h_in_currency: DataTypes.DECIMAL,
    price_change_percentage_24h_in_currency: DataTypes.DECIMAL,
    price_change_percentage_7d_in_currency: DataTypes.DECIMAL
  }, {});
  Coingecko.associate = function(models) {
    // associations can be defined here
  };
  return Coingecko;
};