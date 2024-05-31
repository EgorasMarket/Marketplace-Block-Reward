module.exports = (sequelize, DataTypes) => {
    const RefEarning = sequelize.define(
      "RefEarning",
      {
        email: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        referral: {
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
            type: DataTypes.DECIMAL,
            // allowNull: false,
        },
        earnings: {
            type: DataTypes.DECIMAL,
        },
      },
      {}
    );
    RefEarning.associate = function (models) {};
    return RefEarning;
  };
  