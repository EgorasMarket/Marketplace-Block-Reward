require("dotenv").config();

const { log } = require("debug");
const { Sequelize } = require("sequelize");

class DatabaseConnection {
  constructor() {
    if (!DatabaseConnection.instance) {
      this.sequelize = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASS,
        {
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          dialect: process.env.DB_DIALECT,
          pool: {
            max: 120, // default connection pool size
            min: 0,
            acquire: 30000,
            idle: 10000,
          },
        }
      );
      DatabaseConnection.instance = this;
    }

    return DatabaseConnection.instance;
  }

  getSequelize() {
    return this.sequelize;
  }
}

module.exports = new DatabaseConnection();
