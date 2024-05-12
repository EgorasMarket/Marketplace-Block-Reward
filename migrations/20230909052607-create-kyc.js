'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('KYCs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      email: {
        type: Sequelize.STRING
      },
      type: {
        type: Sequelize.ENUM("NIN", "BVN", "VOTERS CARD", "INTERNATIONAL PASSPORT", "DRIVERS LICENSE")
      },
      level: {
        type: Sequelize.ENUM("LEVEL 1", "LEVEL 2", "LEVEL 3")
      },
      status: {
        type: Sequelize.ENUM("VERIFIED", "NOT VERIFIED")
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
    return queryInterface.dropTable('KYCs');
  }
};