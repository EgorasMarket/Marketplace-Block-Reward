const express = require("express");
const router = express.Router();
const validate = require("express-validation");

// const userValidator = require("../controllers/user/user.validator");
const portfolioController = require("../controllers/portfolio/portfolio.controller");
// const portfolioValidate = require("../controllers/portfolio/")
const { loginLimiter } = require("../middleware/rateLimitMiddleware");

router.get(
  "/get/transaction/history",
  //   loginLimiter,
  // validate(userValidator.register),
  portfolioController.fetchTransactionHistory
);

router.get(
  "/get/my/staking/earnings",
  // validate(userValidator.login),
  portfolioController.getUserStakeEarnings
);

router.get(
  "/get/my/balance",
  // validate(userValidator.login),
  portfolioController.getPortfolios
);

router.get(
  "/get/liquity-pool-balance",
  // validate(userValidator.login),
  portfolioController.liquidityPoolBalance
);

module.exports = router;
