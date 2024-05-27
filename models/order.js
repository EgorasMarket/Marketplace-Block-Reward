module.exports = (sequelize, DataTypes) => {
    const PurchaseOrder = sequelize.define(
      "PurchaseOrder",
      {
        email: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        product_id: {
            type: DataTypes.INTEGER,
            // allowNull: false,
        },
        quantity: {
            type: DataTypes.INTEGER,
            // allowNull: false,
        },
        amount: {
            type: DataTypes.INTEGER,
            // allowNull: false,
        },
        deliveryType: {
          type: DataTypes.ENUM(
            'PICKUP', 
            'DELIVERY'
          ),
        },
        deliveryStatus: {
          type: DataTypes.ENUM('PENDING', 'ENROUTE', 'DELIVERED'),
        },
      },
      {}
    );
    PurchaseOrder.associate = function (models) {};
    return PurchaseOrder;
  };
  