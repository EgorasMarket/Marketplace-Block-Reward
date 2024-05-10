const express = require("express");
const router = express.Router();
const bridgeController = require("../controllers/cryptoevent/cryptoevent.controller");

router.get(
  "/fetch/all/events",
  // validate(bridgeValidator.initBridging),
  bridgeController.fetchAllEvents
);

router.get(
  "/fetch/user/event/:address",
  // validate(bridgeValidator.initBridging),
  bridgeController.fetchUserEvent
);

router.post(
  "/register/for/event",
  // validate(bridgeValidator.initBridging),
  bridgeController.registerForEvent
);

router.get(
  "/test",
  // validate(bridgeValidator.initBridging),
  bridgeController.test2
);
router.get(
  "/fetch/blockchain/event",
  // validate(bridgeValidator.initBridging),
  bridgeController.test_algorithm
);

router.get(
  "/get/referal/count/:address",
  // validate(bridgeValidator.initBridging),
  bridgeController.refererCount
);

router.get(
  "/get/referal/leaderboard",
  // validate(bridgeValidator.initBridging),
  bridgeController.leaderboard
);

module.exports = router;
