'use strict';
module.exports = (sequelize, DataTypes) => {
  const Deposit = sequelize.define('Deposit', {
    hash: DataTypes.STRING,
    blockchain: DataTypes.STRING
  }, {});
  Deposit.associate = function(models) {
    // associations can be defined here
  };
  return Deposit;
};