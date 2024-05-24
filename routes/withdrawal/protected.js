const express = require("express");
const router = express.Router();
const validate = require("express-validation");

const withdrawController = require("../../controllers/withdrawal/withdrawal.controller");
const withdrawalValidator = require("../../controllers/withdrawal/withdrawal.validator");
const accountValidator = require("../../controllers/account/account.validator");
const {
  loginLimiter,
  transaction,
} = require("../../middleware/rateLimitMiddleware");
const transactionAuthMiddleware = require("../../middleware/transactionAuthMiddleware");
const validateRequest = require("../../helpers/joi_validationRequest");
const {
  verify_payout_details,
} = require("../../controllers/account/account.controller");

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
router.post("/verify/account/:account/:bank_code", verify_payout_details);

module.exports = router;
