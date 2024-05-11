const express = require("express");
const router = express.Router();
const userController = require("../controllers/user/user.controller");
const userValidator = require("../controllers/user/user.validator");
router.post("/user/login", userController.login);

router.post("/user/register", userController.register);
module.exports = router;
