'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Assets', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      symbol: {
        type: Sequelize.STRING
      },
      name: {
        type: Sequelize.STRING,
      },
      blockchain: {
        type: Sequelize.ENUM('ETHEREUM', 'BITCOIN', 'BINANCE'),
        allowNull: false,
      },
      contract: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      about: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      image: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      coinID: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      isBase: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      networks: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      isActive: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
      },
      has_cashout: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
    },
      addedBy: {
          type: Sequelize.STRING,
          allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Assets');
  }
};