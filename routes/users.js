const express = require("express");
const router = express.Router();
const validate = require("express-validation");

const userValidator = require("../controllers/user/user.validator");
const userController = require("../controllers/user/user.controller");
const { loginLimiter } = require("../middleware/rateLimitMiddleware");

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
