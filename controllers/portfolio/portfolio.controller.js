require("dotenv").config();
const jwt = require("jsonwebtoken");
const axios = require("axios");

const { PriceOracle, RewardConfig, RefEarning } = require("../../models");

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

exports.getUserStakeEarnings = async (req, res) => {
  try {
    let user = req.user.email;

    let query = `SELECT Stakes.token_id, Stakes.amount_staked, Stakes.start_date, Stakes.rewards_earned, Stakes.nft_id, Products.product_name, Products.product_images FROM Stakes JOIN PurchaseOrders ON PurchaseOrders.id=Stakes.purchase_id JOIN Products ON PurchaseOrders.product_id=Products.id WHERE PurchaseOrders.email='${user}'`;
    const result = await db.sequelize.query(query);
    console.log(result, "llll");

    // console.log(result);
    return successResponse(req, res, result[0]);
  } catch (error) {
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

exports.getUserRefEarnings = async (req, res) => {
  try {
    let user = req.user.email;

    let query = `SELECT RefEarnings.*, Users.swapRef, Users.username, Products.product_name, Products.product_images FROM RefEarnings JOIN Users ON RefEarnings.referral=Users.email JOIN Products ON Products.id=RefEarnings.product_id WHERE RefEarnings.email='${user}'`;
    const result = await db.sequelize.query(query);

    const totalAmount = await RefEarning.sum('amount', {
      where: {
        email: user
      }
    });
    console.log(result, "llll");

    // console.log(result);
    return successResponse(req, res, {
      earningInfo: result[0],
      totalEarnings: totalAmount
    });
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

exports.liquidityPoolBalance = async (req, res) => {
  try {
    let balance = 0;
    const poolBalance = await RewardConfig.findOne();
    if (poolBalance) {
      balance = poolBalance.reward_pool;
    }
    return successResponse(req, res, { poolBalance: balance });
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
