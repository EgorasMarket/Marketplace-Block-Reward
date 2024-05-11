const {
  Asset,
  Coingecko,
  PriceOracle,
  LiquidityPoolBalance,
} = require("../../models");
const { successResponse, errorResponse, uniqueId } = require("../../helpers");
const cron = require("node-cron");

const axios = require("axios").default;
const instance = axios.create({
  baseURL: process.env.COINGECKO_API_ENDPOINT,
  timeout: 15000,

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const instance2 = axios.create({
  baseURL: "https://api.coingecko.com/api/v3/simple/price",
  timeout: 15000,

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});
exports.add = async (req, res) => {
  try {
    const { symbol, name, blockchain, image, networks, coinID, isBase, about } =
      req.body;

    const asset = await Asset.findOne({
      where: { symbol },
    });
    if (asset) {
      throw new Error("Already listed");
    }
    let contract = "n/a";
    if (!isBase) {
      contract = req.body.contract;
    }
    const payload = {
      symbol,
      about,
      name,
      blockchain,
      networks,
      image,
      coinID,
      isBase,
      contract,
      addedBy: req.user.email,
    };

    const newAsset = await Asset.create(payload);
    return successResponse(req, res, { newAsset });
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

exports.update = async (req, res) => {
  try {
    const { symbol, name, blockchain, image, isBase } = req.body;

    const asset = await Asset.findOne({
      where: { symbol },
    });
    if (!asset) {
      throw new Error("Asset does not exist.");
    }
    let contract = "n/a";
    if (!isBase) {
      contract = req.body.contract;
    }
    const payload = {
      symbol,
      name,
      blockchain,
      image,
      isBase,
      contract,
      addedBy: req.user.email,
    };

    await Asset.update(payload, { where: { symbol: asset.symbol } });
    return successResponse(req, res, { newAsset: payload });
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

exports.disableOrEanble = async (req, res) => {
  try {
    const { symbol, state } = req.body;

    const asset = await Asset.findOne({
      where: { symbol },
    });
    if (!asset) {
      throw new Error("Asset does not exist.");
    }

    const payload = {
      isActive: state,
      addedBy: req.user.email,
    };

    await Asset.update(payload, { where: { symbol: asset.symbol } });
    return successResponse(req, res);
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

exports.inactive = async (req, res) => {
  try {
    const page = req.params.page > 0 ? req.params.page : 1;
    const limit = parseInt(req.params.limit);
    const assets = await Asset.findAndCountAll({
      order: [
        ["createdAt", "DESC"],
        ["symbol", "ASC"],
      ],
      offset: (page - 1) * limit,
      limit,
      where: { isActive: false },
    });

    return successResponse(req, res, { assets });
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

exports.active = async (req, res) => {
  try {
    const page = req.params.page > 0 ? req.params.page : 1;
    const limit = parseInt(req.params.limit);
    const assets = await Asset.findAndCountAll({
      order: [
        ["createdAt", "DESC"],
        ["symbol", "ASC"],
      ],
      offset: (page - 1) * limit,
      limit,
      where: { isActive: true },
    });

    return successResponse(req, res, { assets });
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

exports.coingecko = async (req, res) => {
  try {
    let ids = [];

    const assets = await Asset.findAndCountAll({
      order: [
        ["createdAt", "DESC"],
        ["symbol", "ASC"],
      ],
      where: { isActive: true },
    });
    for (let index = 0; index < assets.rows.length; index++) {
      ids.push(assets.rows[index]["coinID"]);
    }
    let result = await instance.get(
      "coins/markets?vs_currency=usd&ids=" +
        ids.join() +
        "&order=market_cap_desc&per_page=250&page=1&sparkline=true&price_change_percentage=1h%2C24h%2C7d"
    );

    for (let rs = 0; rs < result.data.length; rs++) {
      let check = await Coingecko.findOne({
        where: { cid: result.data[rs]["id"] },
      });
      let payload = {
        cid: result.data[rs]["id"],
        symbol: result.data[rs]["symbol"],
        name: result.data[rs]["name"],
        image: result.data[rs]["image"],
        current_price: result.data[rs]["current_price"],
        market_cap: result.data[rs]["market_cap"],
        market_cap_rank: result.data[rs]["market_cap_rank"],
        fully_diluted_valuation: result.data[rs]["fully_diluted_valuation"],
        total_volume: result.data[rs]["total_volume"],
        high_24h: result.data[rs]["high_24h"],
        low_24h: result.data[rs]["low_24h"],
        price_change_24h: result.data[rs]["price_change_24h"],
        price_change_percentage_24h:
          result.data[rs]["price_change_percentage_24h"],
        market_cap_change_24h: result.data[rs]["market_cap_change_24h"],
        market_cap_change_percentage_24h:
          result.data[rs]["market_cap_change_percentage_24h"],
        circulating_supply: result.data[rs]["circulating_supply"],
        total_supply: result.data[rs]["total_supply"],
        max_supply: result.data[rs]["max_supply"],
        sparkline_in_7d: result.data[rs]["sparkline_in_7d"]["price"],
        price_change_percentage_1h_in_currency:
          result.data[rs]["price_change_percentage_1h_in_currency"],
        price_change_percentage_24h_in_currency:
          result.data[rs]["price_change_percentage_24h_in_currency"],
        price_change_percentage_7d_in_currency:
          result.data[rs]["price_change_percentage_7d_in_currency"],
      };
      if (!check) {
        await Coingecko.create(payload);
      } else {
        await Coingecko.update(
          {
            cid: result.data[rs]["id"],
            // "symbol":result.data[rs]['symbol'],
            // "name":result.data[rs]['name'],
            image: result.data[rs]["image"],
            current_price: result.data[rs]["current_price"],
            market_cap: result.data[rs]["market_cap"],
            market_cap_rank: result.data[rs]["market_cap_rank"],
            fully_diluted_valuation: result.data[rs]["fully_diluted_valuation"],
            total_volume: result.data[rs]["total_volume"],
            high_24h: result.data[rs]["high_24h"],
            low_24h: result.data[rs]["low_24h"],
            price_change_24h: result.data[rs]["price_change_24h"],
            price_change_percentage_24h:
              result.data[rs]["price_change_percentage_24h"],
            market_cap_change_24h: result.data[rs]["market_cap_change_24h"],
            market_cap_change_percentage_24h:
              result.data[rs]["market_cap_change_percentage_24h"],
            circulating_supply: result.data[rs]["circulating_supply"],
            total_supply: result.data[rs]["total_supply"],
            max_supply: result.data[rs]["max_supply"],
            sparkline_in_7d: result.data[rs]["sparkline_in_7d"]["price"],
            price_change_percentage_1h_in_currency:
              result.data[rs]["price_change_percentage_1h_in_currency"],
            price_change_percentage_24h_in_currency:
              result.data[rs]["price_change_percentage_24h_in_currency"],
            price_change_percentage_7d_in_currency:
              result.data[rs]["price_change_percentage_7d_in_currency"],
          },
          { where: { cid: result.data[rs]["id"] } }
        );
      }
    }
    return successResponse(req, res, {});
  } catch (error) {
    console.log(error);
    return errorResponse(req, res, error.message);
  }
};

exports.coingecko2 = async (req, res) => {
  console.log("ddd");
  try {
    //check if the egoras price row exist in coin geko table
    const getEGcCOinConfig = await PriceOracle.findOne({
      where: {
        ids: "egax",
      },
    });

    //set parameters to create one if it does not exist

    const ids = "egax";
    const vs_currencies = "usd";
    const include_24hr_change = "true";
    const include_market_cap = "false";
    const include_24hr_vol = "false";
    const include_last_updated_at = "true";

    //create an entry if the egoras ticker doesn't exist
    if (!getEGcCOinConfig) {
      await PriceOracle.create({
        ids,
        vs_currencies,
        include_24hr_change,
        include_market_cap,
        include_24hr_vol,
        include_last_updated_at,
      });
    }

    const getLiquidityAmount = await LiquidityPoolBalance.findOne({
      where: {
        tokenASymbol: "USD",
        tokenBSymbol: "EGAX",
      },
    });

    console.log(getLiquidityAmount.tokenA, getLiquidityAmount.tokenB);

    let finalAmount =
      parseFloat(getLiquidityAmount.tokenA) /
      parseFloat(getLiquidityAmount.tokenB);

    await PriceOracle.update(
      {
        price: finalAmount.toFixed(3),
      },
      {
        where: {
          ids,
        },
      }
    );
    return successResponse(req, res, {});
  } catch (error) {
    return errorResponse(req, res, error.message, 500, error);
  }
};

cron.schedule(
  "0 1 * * *",
  async () => {
    console.log("Fetching Egc Price");
    console.log("ddd");
    try {
      console.log(typeof PriceOracle);

      const getEGcCOinConfig = await PriceOracle.findOne({
        where: {
          ids: "egoras-credit",
        },
      });

      if (!getEGcCOinConfig) {
        await PriceOracle.create({
          ids: "egoras-credit",
          vs_currencies: "usd",
          include_24hr_change: "true",
          include_market_cap: "false",
          include_24hr_vol: "false",
          include_last_updated_at: "true",
        });
      }

      const {
        ids,
        vs_currencies,
        include_24hr_change,
        include_market_cap,
        include_24hr_vol,
        include_last_updated_at,
      } = getEGcCOinConfig;

      axios
        .get("https://api.coingecko.com/api/v3/simple/price", {
          params: {
            ids,
            vs_currencies,
            include_24hr_change,
            include_market_cap,
            include_24hr_change,
            include_24hr_vol,
            include_last_updated_at,
          },
        })
        .then((response) => {
          console.log(response.data["egoras-credit"].usd);
          const price = response.data["egoras-credit"].usd;
          if (price) {
            //update the price field

            PriceOracle.update(
              {
                price,
              },
              {
                where: {
                  ids,
                },
              }
            );
          }
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    } catch (error) {
      console.log(error.message);
    }
  },
  {
    scheduled: true,
  }
);

cron.schedule(
  "* * * * *",
  async () => {
    console.log("Fetching egax Price");
    console.log("ddd");
    try {
      //check if the egoras price row exist in coin geko table
      const getEGcCOinConfig = await PriceOracle.findOne({
        where: {
          ids: "egax",
        },
      });

      //set parameters to create one if it does not exist

      const ids = "egax";
      const vs_currencies = "usd";
      const include_24hr_change = "true";
      const include_market_cap = "false";
      const include_24hr_vol = "false";
      const include_last_updated_at = "true";

      //create an entry if the egoras ticker doesn't exist
      if (!getEGcCOinConfig) {
        await PriceOracle.create({
          ids,
          vs_currencies,
          include_24hr_change,
          include_market_cap,
          include_24hr_vol,
          include_last_updated_at,
        });
      }

      const getLiquidityAmount = await LiquidityPoolBalance.findOne({
        where: {
          tokenASymbol: "USD",
          tokenBSymbol: "EGAX",
        },
      });

      console.log(getLiquidityAmount.tokenA, getLiquidityAmount.tokenB);

      let finalAmount =
        parseFloat(getLiquidityAmount.tokenA) /
        parseFloat(getLiquidityAmount.tokenB);

      await PriceOracle.update(
        {
          price: finalAmount.toFixed(3),
        },
        {
          where: {
            ids,
          },
        }
      );
      return successResponse(req, res, {});
    } catch (error) {
      return errorResponse(req, res, error.message, 500, error);
    }
  },
  {
    scheduled: true,
  }
);
