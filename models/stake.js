"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Stake extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Stake.init(
    {
      stake_id: {
        allowNull: false,
        type: DataTypes.UUID(),
        defaultValue: DataTypes.UUIDV4(),
        primaryKey: true,
      },
      user_id: DataTypes.STRING,
      token_id: DataTypes.STRING,
      amount_staked: DataTypes.DECIMAL,
      start_date: DataTypes.STRING,
      end_date: DataTypes.STRING,
      rewards_earned: DataTypes.DECIMAL,
    },
    {
      sequelize,
      modelName: "Stake",
    }
  );
  return Stake;
};
