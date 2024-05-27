"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("userActivities", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID(),
        defaultValue: Sequelize.UUIDV4(),
      },
      status: {
        type: Sequelize.STRING,
      },
      message: {
        type: Sequelize.STRING,
      },
      call_type: {
        type: Sequelize.STRING,
      },
      user_id: {
        type: Sequelize.STRING,
      },

      tunnel: {
        type: Sequelize.STRING,
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("userActivities");
  },
};
