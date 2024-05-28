const express = require("express");
const router = express.Router();
const validate = require("express-validation");

const rewardController = require("../../controllers/reward");

router.get("/distribute_reward", rewardController.distribute_reward);

module.exports = router;
