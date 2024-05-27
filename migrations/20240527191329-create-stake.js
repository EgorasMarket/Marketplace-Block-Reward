"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Stakes", {
      stake_id: {
        allowNull: false,
        type: Sequelize.UUID(),
        defaultValue: Sequelize.UUIDV4(),
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.STRING,
      },
      token_id: {
        type: Sequelize.STRING,
      },
      amount_staked: {
        type: Sequelize.DECIMAL,
      },
      start_date: {
        type: Sequelize.STRING,
      },
      end_date: {
        type: Sequelize.STRING,
      },
      rewards_earned: {
        type: Sequelize.DECIMAL,
      },
      nft_id: {
        type: Sequelize.STRING(2000),
      },
      purchase_val: {
        type: Sequelize.DECIMAL(10),
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
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Stakes");
  },
};
