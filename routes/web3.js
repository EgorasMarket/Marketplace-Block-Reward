const express = require("express");
const router = express.Router();
const validate = require("express-validation");

const web3Controller = require("../controllers/web3/web3.controller");

router.get(
  "/test",
  web3Controller.watch
);

router.get(
  "/egax/watch",
  web3Controller.watchEgax
);

router.get(
  "/get/price/ticker",
  web3Controller.getTickers
);

module.exports = router;
