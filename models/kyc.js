module.exports = (sequelize, DataTypes) => {
  const KYC = sequelize.define(
    "KYC",
    {
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM(
          "EMAIL",
          "NIN",
          "BVN",
          "VOTERS_CARD",
          "INTERNATIONAL_PASSPORT",
          "DRIVERS_LICENSE",
          "FOREIGN"
        ),
      },
      level: {
        type: DataTypes.ENUM("LEVEL_1", "LEVEL_2", "LEVEL_3"),
      },
      status: {
        type: DataTypes.ENUM("VERIFIED", "NOT_VERIFIED"),
        defaultValue: "NOT_VERIFIED",
      },
    },
    {}
  );
  KYC.associate = function (models) {};
  return KYC;
};
