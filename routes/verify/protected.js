const express = require("express");
const router = express.Router();
const validate = require("express-validation");

const kycController = require("../../controllers/kyc/kyc.controller");

router.post(
  "/submit/bvn",
  //   loginLimiter,
  // validate(userValidator.register),
  kycController.addBVN
);

router.get(
  "/get/my/bvn",
  //   loginLimiter,
  // validate(userValidator.login),
  kycController.getMyBVN
);

module.exports = router;
