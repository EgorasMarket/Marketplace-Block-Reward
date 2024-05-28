module.exports = (sequelize, DataTypes) => {
    const DeliveryDetails = sequelize.define(
      "DeliveryDetails",
      {
        email: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        fullname: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        phoneNumber: {
            type: DataTypes.STRING,
            // allowNull: false,
        },
        telegramId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        country: {
            type: DataTypes.STRING,
            // allowNull: false,
        },
        address: {
            type: DataTypes.STRING,
            allowNull: true,
        },
      },
      {}
    );
    DeliveryDetails.associate = function (models) {};
    return DeliveryDetails;
  };
  