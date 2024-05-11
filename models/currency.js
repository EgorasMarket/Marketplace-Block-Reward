'use strict';
module.exports = (sequelize, DataTypes) => {
  const Currency = sequelize.define('Currency', {
    name: DataTypes.STRING,
    price: DataTypes.DECIMAL
  }, {});
  Currency.associate = function(models) {
    // associations can be defined here
  };
  return Currency;
};