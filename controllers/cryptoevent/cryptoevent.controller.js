const axios = require("axios").default;

const { errorResponse, successResponse } = require("../../helpers");
const db = require("../../config/sequelize");
var { Bridge, CryptoEvent, LiquidityPoolBalance } = require("../../models");
const { differenceInHours } = require("date-fns");

const instance = axios.create({
  baseURL: "https://egoscan.io/",
  timeout: 15000,

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const fetchAllEvents = async (req, res) => {
  try {
    // console.log(txnId);
    const allEvents = await CryptoEvent.findAll();

    console.log(allEvents);
    // if (!fetchBridgeByTxID)
    //   throw new Error("Invalid Transaction Hash Detected");
    return successResponse(req, res, { allEvents });
    //check for bridges that are alive
    // const liveBridges = await
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};
const registerForEvent = async (req, res) => {
  const { address, refCode } = req.body;

  try {
    // console.log(txnId);
    const findEvent = await CryptoEvent.findOne({
      where: {
        address,
      },
    });

    console.log(findEvent);
    if (findEvent) {
      throw new Error("Address already registered for event");
    }

    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";

    for (let i = 0; i < 10; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      code += characters.charAt(randomIndex);
    }
    const registerEvent = await CryptoEvent.create({
      address,
      refCode,
      referralId: code,
    });

    return successResponse(req, res, { referalCode: code });
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

const fetchUserEvent = async (req, res) => {
  try {
    const { address } = req.params;
    // console.log(txnId);
    const allEvents = await CryptoEvent.findOne({
      where: {
        address,
      },
    });

    console.log(allEvents);
    // if (!fetchBridgeByTxID)
    //   throw new Error("Invalid Transaction Hash Detected");
    return successResponse(req, res, { allEvents });
    //check for bridges that are alive
    // const liveBridges = await
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

const refererCount = async (req, res) => {
  try {
    const { address } = req.params;

    //check validity of user address
    const isUser = await CryptoEvent.findOne({
      where: {
        address,
      },
    });

    if (!isUser) throw new Error("Invalid user credentials");

    let resMain = await CryptoEvent.findAndCountAll({
      where: { refCode: isUser.referralId },
    });

    return successResponse(req, res, { resMain });
  } catch (error) {
    console.log(error);
    return errorResponse(req, res, error.message);
  }
};

const leaderboard = async (req, res) => {
  try {
    const [leaderboard, metadata] = await db.sequelize.query(
      "SELECT COUNT(r.refCode) AS refCount, r.referralId, r.address FROM CryptoEvents r JOIN CryptoEvents c ON r.referralId = c.refCode GROUP BY r.referralId, r.address ORDER BY refCount DESC"
    );

    return successResponse(req, res, { leaderboard });
  } catch (error) {
    console.log(error);
    return errorResponse(req, res, error.message);
  }
};
const test = async (req, res) => {
  try {
    let startBlock = 989427;
    const allEvent = await CryptoEvent.findAll();
    console.log(allEvent.length);

    //egoscan.io/api/v2/addresses/0xbb8fc16787d6a7c221d5b2c8177823c9d9e8475d/transactions?filter=to%20%7C%20from

    let result = {};

    if (allEvent.length > 0) {
      allEvent.forEach(async (watch, index) => {
        // console.log(watch.address);
        let res = await instance.get(
          "api/v2/addresses/" +
            watch.address +
            "/transactions?filter=to%20%7C%20from"
        );

        result = res.data.items;
        console.log(res.data.items, "agba");
      });
    }

    // console.log(result);
    return successResponse(req, res, {});
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};
const test2 = async (req, res) => {
  try {
    const result = await rewardAlgorithm({
      // address: "0x690B4cBEF361ccD9F2f4eAf0a47BE649b9910b7d",
      address: "0x3ef44a7a4f84dc9ec61012be102e3a3a1291a18e",
    });

    return successResponse(req, res, { result });
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};
const test_algorithm = async (req, res) => {
  const allEvent = await CryptoEvent.findAll();

  if (allEvent.length <= 0) {
    return successResponse(req, res, {});
  }

  let payload = null;
  let data = [];

  for (const watch of allEvent) {
    const result = await rewardAlgorithm({ address: watch.address });
    data.push(result);
  }

  return successResponse(req, res, { data });
};

const rewardAlgorithm = async ({ address }) => {
  let points = 0;
  let cummulative_volume = 0; //value is in usd

  let res = await instance.get(
    "api/v2/addresses/" + address + "/transactions?filter=to%20%7C%20from"
  );
  const egaxUsd = await getEgaxUSDEquiv();

  //loop through the record
  if (res.data.items.length <= 0) {
    return;
  }

  for (const record of res.data.items) {
    //detect the kind of transaction

    console.log(record.tx_types, "acho");

    // const sum = parseInt(record.value) / 1000000000000000000;

    //determine the amount in USD for each transaction
    const sum = this.parseValue(record.value) * egaxUsd;
    cummulative_volume = cummulative_volume + sum;

    console.log(cummulative_volume, sum, "akpppp");
  }

  //this function will return the reward payload for the particular address passed as params
  const update = await CryptoEvent.update(
    {
      volume: cummulative_volume,
      points: cummulative_volume / 100,
    },
    {
      where: {
        address,
      },
    }
  );
  console.log(update);
  return res.data.items;
};

const getEgaxUSDEquiv = async () => {
  try {
    const usdEgax = await LiquidityPoolBalance.findOne({
      where: {
        tokenASymbol: "USD",
        tokenBSymbol: "EGAX",
      },
    });

    //do math

    const result = Number(usdEgax.tokenA) / Number(usdEgax.tokenB);

    return result;
  } catch (error) {
    console.log(error.message);

    return 0;
    return;
  }
};

exports.parseValue = (value) => {
  return parseInt(value) / 1000000000000000000;
};
module.exports = {
  fetchAllEvents,
  refererCount,
  registerForEvent,
  fetchUserEvent,
  leaderboard,
  test,
  test2,
  test_algorithm,
};
