const express = require("express");
const router = express.Router();
const validate = require("express-validation");

const userValidator = require("../controllers/user/user.validator");
const userController = require("../controllers/user/user.controller");
const accountController = require("../controllers/account/account.controller");
const {
  loginLimiter,
  transaction,
} = require("../middleware/rateLimitMiddleware");
// const transactionAuthMiddleware = require("../middleware/transactionAuthMiddleware");
// const validateRequest = require("../helpers/joi_validationRequest");

router.get("/me", userController.profile);
router.post("/change/password", validate(userValidator.changePassword), userController.changePassword);


module.exports = router;
