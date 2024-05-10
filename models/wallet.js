'use strict';
module.exports = (sequelize, DataTypes) => {
  const Wallet = sequelize.define('Wallet', {
    blockchain: {
      type: DataTypes.ENUM('ETHEREUM', 'BITCOIN', 'BINANCE'),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    meta: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {});
  Wallet.associate = function(models) {
    // associations can be defined here
  };
  return Wallet;
};