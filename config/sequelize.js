const getDb = require("./DatabaseConnection");
const db = {};
const sequelize = getDb.getSequelize();
sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

db.sequelize = sequelize;
module.exports = db;
