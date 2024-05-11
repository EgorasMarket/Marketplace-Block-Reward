const express = require("express");
const router = express.Router();
const validate = require("express-validation");

// const userValidator = require("../controllers/user/user.validator");
const portfolioController = require("../controllers/portfolio/portfolio.controller");
const { loginLimiter } = require("../middleware/rateLimitMiddleware");

router.post(
  "/get/transaction/history",
  //   loginLimiter,
  // validate(userValidator.register),
  portfolioController.fetchTransactionHistory
);
// router.post(
//   "/login",
//   loginLimiter,
//   // validate(userValidator.login),
//   portfolioController.login
// );

module.exports = router;
