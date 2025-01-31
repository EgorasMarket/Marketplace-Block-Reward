require("dotenv").config();
const jwt = require("jsonwebtoken");
const axios = require("axios");

const { PriceOracle } = require("../../models");

const { successResponse, errorResponse } = require("../../helpers");

const db = require("../../config/sequelize");
// const { sendTemplate } = require("../../helpers/utils");

exports.getTickers = async (req, res) => {
  try {
    const query = `call sp_getNewThickers()`;
    const listThickers = await db.sequelize.query(query);

    return successResponse(req, res, { listThickers });
  } catch (error) {
    console.log(error);
    return errorResponse(req, res, error.message);
  }
};

exports.getPortfolios = async (req, res) => {
  try {
    let user = req.user.email;
    let query = `call sp_getPortfolios('${user}')`;
    const result = await db.sequelize.query(query);
    const getEGcCOinConfig = await PriceOracle.findAll();

    // console.log(getEGcCOinConfig, "dd__kkk");

    result.forEach((item) => {
      // console.log("user.firstName, user.lastName");

      if (item.symbol === "EGC") {
        // Update the object with "usd_bal": "45"
        // item.usd_bal = "45";
        getEGcCOinConfig.forEach((ggg) => {
          console.log("LLLLLkkk");
          console.log(ggg.ids);
          if (ggg.ids === "egoras-credit") {
            item.usd_bal = ggg.price;
          }
        });
      }

      if (item.symbol === "EGAX") {
        // Update the object with "usd_bal": "45"
        // item.usd_bal = "45";
        getEGcCOinConfig.forEach((ggg) => {
          console.log("LLLLLkkk");
          console.log(ggg.ids);
          if (ggg.ids === "egax") {
            item.usd_bal = ggg.price;
          }
        });
      }
    });
    // console.log(result);
    return successResponse(req, res, result);
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

exports.fetchTransactionHistory = async (req, res) => {
  console.log(req.query.page, req.query.limit, "Kkkkkk");
  try {
    const page = req.query.page > 0 ? req.query.page : 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    let user = req.user.email;
    let query = `call sp_getHistory('${user}', ${offset}, ${limit})`;
    const result = await db.sequelize.query(query);

    return successResponse(req, res, result);
  } catch (error) {
    console.log(error);
    return errorResponse(req, res, error.message);
  }
};

exports.getSpecificPortfolios = async (req, res) => {
  try {
    let user = req.user.email;
    let token = req.params.token;
    let base = req.params.base;
    let query = `SELECT (SELECT value FROM Portfolios WHERE symbol = '${token}' AND email = '${user}') AS token_balance, (SELECT value FROM Portfolios WHERE symbol = '${base}' AND email = '${user}') AS base_balance, NOW() AS time LIMIT 1;`;
    const result = await db.sequelize.query(query);
    return successResponse(req, res, result);
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};
