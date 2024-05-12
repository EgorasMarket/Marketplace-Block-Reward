const express = require("express");
const router = express.Router();
const accountController = require("../../controllers/account/account.controller");

router.post(
  "/watu",
  // validate(bridgeValidator.initBridging),
  accountController.watu_webhook
);

module.exports = router;
