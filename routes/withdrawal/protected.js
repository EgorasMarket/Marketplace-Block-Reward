const express = require("express");
const router = express.Router();
const validate = require("express-validation");

const withdrawController = require("../../controllers/withdrawal/withdrawal.controller");
const withdrawalValidator = require("../../controllers/withdrawal/withdrawal.validator");
const {
  loginLimiter,
  transaction,
} = require("../../middleware/rateLimitMiddleware");
const transactionAuthMiddleware = require("../../middleware/transactionAuthMiddleware");
const validateRequest = require("../../helpers/joi_validationRequest");

router.post(
  "/external",
  validate(withdrawalValidator.external),
  transaction,
  withdrawController.external
);
router.post(
  "/internal",
  validate(withdrawalValidator.internal),
  transaction,
  withdrawController.internal
);
router.post(
  "/cashout",
  validate(withdrawalValidator.cashout),
  transaction,
  withdrawController.cashout
);
module.exports = router;
