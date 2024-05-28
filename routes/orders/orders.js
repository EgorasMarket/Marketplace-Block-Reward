const express = require("express");
const router = express.Router();
const orderController = require("../../controllers/orders/orders.controller");
// const userValidator = require("../../controllers/orders/user.validator");
// router.post("/user/login", userController.login);

router.post("/purchase/product", orderController.PurchaseProduct);
router.post("/submit/delivery-info", orderController.SubmitDelivery);
module.exports = router;
