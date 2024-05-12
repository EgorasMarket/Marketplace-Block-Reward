const express = require("express");
const router = express.Router();
const { validate, ValidationError, Joi } = require("express-validation");

const userValidator = require("../controllers/user/user.validator");
const userController = require("../controllers/user/user.controller");
const withdrawController = require("../controllers/withdrawal/withdrawal.controller");
const withdrawalValidator = require("../controllers/withdrawal/withdrawal.validator");
const {
  loginLimiter,
  transaction,
} = require("../middleware/rateLimitMiddleware");
const transactionAuthMiddleware = require("../middleware/transactionAuthMiddleware");
const validateRequest = require("../helpers/joi_validationRequest");

router.post(
  "/register",
  loginLimiter,
  // validate(userValidator.register),
  userController.register
);
router.post(
  "/login",
  loginLimiter,
  // validate(userValidator.login),
  userController.login
);
module.exports = router;
