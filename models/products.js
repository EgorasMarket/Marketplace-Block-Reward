"use strict";
module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define(
    "Product",
    {
      status: {
        type: DataTypes.ENUM(
          "NEW",
          "APPROVED",
          "UPLOADED",
          "CANCELLED",
          "SOLD"
        ),
        allowNull: true,
      },
      product_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      personnel: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      user_wallet: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      product_name: DataTypes.STRING,
      product_images: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      product_brand: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      product_state: {
        type: DataTypes.ENUM("INIT", "NEW", "REFUB"),
        allowNull: true,
        defaultValue: "INIT",
      },
      product_specifications: {
        type: DataTypes.STRING(4000),
        allowNull: true,
      },
      product_details: {
        type: DataTypes.STRING(4000),
        allowNull: true,
      },
      product_category: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      amount: DataTypes.DECIMAL,
    },
    {}
  );
  Product.associate = function (models) {
    // associations can be defined here
  };
  return Product;
};