'use strict';
module.exports = (sequelize, DataTypes) => {
  const Portfolio = sequelize.define('Portfolio', {
    symbol: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    value: {
      type: DataTypes.DECIMAL(65,30),
      allowNull: false,
    },
    in_trade: {
      type: DataTypes.DECIMAL(65,30),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('CRYPTO', 'FIAT'),
      allowNull: false,
    }

  }, {});
  Portfolio.associate = function(models) {
    // associations can be defined here
  };
  return Portfolio;
};