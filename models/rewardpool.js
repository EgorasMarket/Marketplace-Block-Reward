'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RewardPool extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  RewardPool.init({
    user_id: DataTypes.STRING,
    reward: DataTypes.DECIMAL,
    allocated_pool_value: DataTypes.DECIMAL
  }, {
    sequelize,
    modelName: 'RewardPool',
  });
  return RewardPool;
};