module.exports = (sequelize, DataTypes) => {
  const BVN = sequelize.define('BVN', {

    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    bvn_number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    bvn_meta: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('APPROVED', 'PENDING', 'REJECTED', 'AWAITING_APPROVAL'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    approved_by: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {});

  BVN.associate = function (models) {
    // Define associations here
  };

  return BVN;
};
