'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class virtual_banks extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  virtual_banks.init({
    account_id: DataTypes.STRING,
    integration: DataTypes.STRING,
    account_name: DataTypes.STRING,
    email: DataTypes.STRING,
    bank: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'virtual_banks',
  });
  return virtual_banks;
};