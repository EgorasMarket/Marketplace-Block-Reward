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
  withdrawController.external
);
router.post(
  "/internal",
  validate(withdrawalValidator.internal),
  withdrawController.internal
);
router.post(
  "/cashout",
  validate(withdrawalValidator.cashout),
  withdrawController.cashout
);

router.post(
  "/get/user",
  validate(withdrawalValidator.getUser),
  withdrawController.getUser
);

router.get("/list-banks", withdrawController.list_banks);

module.exports = router;
