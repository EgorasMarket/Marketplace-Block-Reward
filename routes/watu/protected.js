const express = require("express");
const router = express.Router();
const accountController = require("../../controllers/account/account.controller");

router.post(
  "/generate-account",
  // validate(bridgeValidator.initBridging),
  accountController.getVirtualAccount
);

module.exports = router;
