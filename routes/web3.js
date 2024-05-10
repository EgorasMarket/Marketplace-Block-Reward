const express = require("express");
const router = express.Router();
const validate = require("express-validation");

const web3Controller = require("../controllers/web3/web3.controller");
const { loginLimiter } = require("../middleware/rateLimitMiddleware");

router.get(
  "/test",
  // loginLimiter,
  // validate(userValidator.register),
  web3Controller.testing
);

module.exports = router;
