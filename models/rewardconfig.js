'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RewardConfig extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  RewardConfig.init({
    reward_constant: DataTypes.DECIMAL,
    reward_pool: DataTypes.DECIMAL
  }, {
    sequelize,
    modelName: 'RewardConfig',
  });
  return RewardConfig;
};