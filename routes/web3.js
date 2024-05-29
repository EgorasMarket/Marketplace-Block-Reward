const express = require("express");
const router = express.Router();
const validate = require("express-validation");

const web3Controller = require("../controllers/web3/web3.controller");

router.get(
  "/test",
  // loginLimiter,
  // validate(userValidator.register),
  web3Controller.watch
);

router.get(
  "/egax/watch",
  // loginLimiter,
  // validate(userValidator.register),
  web3Controller.watchEgax
);

module.exports = router;
