const express = require("express");
const router = express.Router();
const validate = require("express-validation");
const userController = require("../controllers/user/user.controller");
const userValidator = require("../controllers/user/user.validator");




router.post("/user/register", userController.swapSignup);
// router.post("/user/register", userController.register);

router.post("/user/login", userController.login);
router.post("/user/password/reset/link", validate(userValidator.resetLink), userController.resetLink);
router.post("/user/password/reset", validate(userValidator.resetPassword), userController.resetPassword);

module.exports = router;
