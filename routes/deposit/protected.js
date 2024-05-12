const express = require("express");
const router = express.Router();
const validate = require("express-validation");

const depositController = require("../../controllers/wallet/wallet.controller");
const walletValidator = require("../../controllers/wallet/wallet.validator");
const accountController = require("../../controllers/account/account.controller");
const {
  loginLimiter,
  transaction,
} = require("../../middleware/rateLimitMiddleware");
const transactionAuthMiddleware = require("../../middleware/transactionAuthMiddleware");
const validateRequest = require("../../helpers/joi_validationRequest");

router.post("/crypto", validate(walletValidator.get), depositController.get);
router.get(
  "/fiat",
  // validate(walletValidator.get),
  accountController.getVirtualAccount
);

module.exports = router;
