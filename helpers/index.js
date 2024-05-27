const {
  Portfolio,
  Pair,
  Open,
  Transactions,
  Notification,
  LiquidityPoolBalance,
  LiquidityPool,
  ReferralBalance,
  Deposit,
  Bridge,
  PurchaseOrder,
  Product
} = require("../models");

const Sequelize = require("sequelize");
const db = require("../config/sequelize");
const Op = Sequelize.Op;
exports.successResponse = (req, res, data, code = 200) =>
  res.send({
    code,
    data,
    success: true,
  });

exports.errorResponse = (
  req,
  res,
  errorMessage = "Something went wrong",
  code = 500,
  error = {}
) =>
  res.status(500).json({
    code,
    errorMessage,
    error,
    data: null,
    success: false,
  });

exports.getRan = (min, max) => {
  return Math.floor(Math.random() * (max - min) + min);
};

exports.validateEmail = (email) => {
  const re =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

exports.validateFields = (object, fields) => {
  const errors = [];
  fields.forEach((f) => {
    if (!(object && object[f])) {
      errors.push(f);
    }
  });
  return errors.length ? `${errors.join(", ")} are required fields.` : "";
};

exports.uniqueId = (length = 13) => {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

exports.checkBalance = async (email, amount, symbol) => {
  const userPortfolio = await Portfolio.findOne({
    where: {
      value: {
        [Op.gte]: amount,
      },
      email,
      symbol,
    },
  });

  return userPortfolio;
};

exports.checkLiquidityBalance = async (condition) => {
  const liquidityBalance = await LiquidityPoolBalance.findOne({
    where: {
      ...condition,
    },
  });

  return liquidityBalance;
};

exports.checkPair = async (ticker, state) => {
  const pair = await Pair.findOne({
    where: { ticker, state },
  });

  return pair;
};

exports.getSellOrder = async (where) => {
  const order = await Open.findOne({
    where,
  });

  return order;
};

exports.getAmount = async (price, value, type) => {
  switch (type) {
    case "BUY":
      return price * value;

    case "SELL":
      return value;

    default:
      break;
  }
};

exports.nt = async (payload, t) => {
  const { email, tunnel } = payload;
  try {
    const createTx = await Notification.create(payload, { transaction: t });
    if (createTx) {
      if (tunnel === activity_tunnel.admin) {
        console.log("it is admin");
        // const realtime = getAblyInstance();
        const channel = realtime.channels.get("admin-notification");
        await channel.publish("new-notification", createTx);
      }
      return [[undefined, 1]];
    }
    return [[undefined, 0]];
  } catch (error) {
    console.log(error);
    return [[undefined, 0]];
  }
};
// goodluck

exports.tx = async (payload, t) => {
  try {
    const createTx = await Transactions.create(payload, { transaction: t });

    if (createTx) {
      // io.emit(`transaction/${email}`, payload);
      return [[undefined, 1]];
    }
    return [[undefined, 0]];
  } catch (error) {
    console.log(error);
    return [[undefined, 0]];
  }
};

exports.addOrder = async (payload, t) => {
  try {
    const createTx = await PurchaseOrder.create(payload, { transaction: t });

    if (createTx) {
      // io.emit(`transaction/${email}`, payload);
      return [[undefined, 1]];
    }
    return [[undefined, 0]];
  } catch (error) {
    console.log(error);
    return [[undefined, 0]];
  }
};

exports.Depoxit = async (payload, t) => {
  try {
    const createTx = await Deposit.create(payload, { transaction: t });

    if (createTx) {
      // io.emit(`transaction/${email}`, payload);
      return [[undefined, 1]];
    }
    return [[undefined, 0]];
  } catch (error) {
    console.log(error);
    return [[undefined, 0]];
  }
};


exports.DeductQuantity = async (payload, t) => {
  try {
    const createTx = await Product.update(
      { quantity: Sequelize.literal('quantity - '+payload.quantity) },
      { where: { id: payload.product_id} } 
    )

    if (createTx) {
      // io.emit(`transaction/${email}`, payload);
      return [[undefined, 1]];
    }
    return [[undefined, 0]];
  } catch (error) {
    console.log(error);
    return [[undefined, 0]];
  }
};

exports.UpdatBridge = async (txnId, t) => {
  try {
    const createTx = await Bridge.update(
      {
        status: "BRIDGING",
      },
      {
        where: {
          txnId: txnId,
        },
        transaction: t,
      }
    );

    if (createTx) {
      // io.emit(`transaction/${email}`, payload);
      return [[undefined, 1]];
    }
    return [[undefined, 0]];
  } catch (error) {
    console.log(error);
    return [[undefined, 0]];
  }
};

exports.increaseUserLiquidity = async (
  email,
  tokenA,
  tokenB,
  tokenASymbol,
  tokenBSymbol,
  t
) => {
  try {
    let exist = await LiquidityPool.findOne({
      where: { email, tokenASymbol, tokenBSymbol },
    });
    if (!exist) {
      const liquidityPool = await LiquidityPool.create(
        {
          email,
          tokenA,
          tokenB,
          tokenASymbol,
          tokenBSymbol,
        },
        { transaction: t }
      );

      if (liquidityPool) {
        return [[undefined, 1]];
      } else {
        return [[undefined, 0]];
      }
    } else {
      const incrementValues = {
        tokenA,
        tokenB,
      };
      const condition = {
        email,
        tokenASymbol,
        tokenBSymbol,
      };

      const [updatedRowsCount] = await LiquidityPool.update(
        Object.keys(incrementValues).reduce((acc, column) => {
          acc[column] = db.sequelize.literal(
            `\`${column}\` + ${incrementValues[column]}`
          );
          return acc;
        }, {}),
        {
          where: condition,
          transaction: t,
        }
      );

      return [[undefined, updatedRowsCount]];
    }
  } catch (error) {
    console.log(error);
    return [[undefined, 0]];
  }
};

exports.increaseLiquidity = async (
  tokenA,
  tokenB,
  tokenASymbol,
  tokenBSymbol,
  t
) => {
  try {
    let exist = await LiquidityPoolBalance.findOne({
      where: { tokenASymbol, tokenBSymbol },
    });
    if (!exist) {
      const liquidityPoolBalance = await LiquidityPoolBalance.create(
        {
          tokenA,
          tokenB,
          tokenASymbol,
          tokenBSymbol,
        },
        { transaction: t }
      );

      if (liquidityPoolBalance) {
        return [[undefined, 1]];
      } else {
        return [[undefined, 0]];
      }
    } else {
      const incrementValues = {
        tokenA,
        tokenB,
      };
      const condition = {
        tokenASymbol,
        tokenBSymbol,
      };

      const [updatedRowsCount] = await LiquidityPoolBalance.update(
        Object.keys(incrementValues).reduce((acc, column) => {
          acc[column] = db.sequelize.literal(
            `\`${column}\` + ${incrementValues[column]}`
          );
          return acc;
        }, {}),
        {
          where: condition,
          transaction: t,
        }
      );

      return [[undefined, updatedRowsCount]];
    }
  } catch (error) {
    console.log(error);
    return [[undefined, 0]];
  }
};
exports.addToLiquidity = async (condition, colunm, amount, t) => {
  const liquidityPoolBalance = await LiquidityPoolBalance.increment(colunm, {
    by: amount,
    transaction: t,
    where: { ...condition },
  });
  return liquidityPoolBalance;
};

exports.deductLiquidity = async (condition, colunm, amount, t) => {
  const liquidityPoolBalance = await LiquidityPoolBalance.decrement(colunm, {
    by: amount,
    transaction: t,
    where: { ...condition },
  });
  return liquidityPoolBalance;
};

exports.deductReferralReward = async (email, amount, type, t) => {
  const referralReward = await ReferralBalance.decrement("amount", {
    by: amount,
    transaction: t,
    where: {
      email,
      type,
      amount: {
        [Op.gte]: amount,
      },
    },
  });
  return referralReward;
};

exports.addReferralReward = async (email, amount, type, t) => {
  let port = await ReferralBalance.findOne({ where: { email, type } });
  if (!port) {
    const userPortfolio = await ReferralBalance.create(
      {
        type,
        email,
        amount,
      },
      { transaction: t }
    );

    if (userPortfolio) {
      return [[undefined, 1]];
    }
    return [[undefined, 0]];
  } else {
    const userPortfolio = await ReferralBalance.increment("amount", {
      by: amount,
      transaction: t,
      where: { email, type },
    });
    return userPortfolio;
  }
};

exports.add = async (email, symbol, which, colunm, amount, t) => {
  switch (which) {
    case "portfolio":
      let port = await Portfolio.findOne({ where: { symbol, email } });
      if (!port) {
        console.log("create port");
        const userPortfolio = await Portfolio.create(
          {
            symbol: symbol,
            email: email,
            value: amount,
            in_trade: 0.0,
            type: "CRYPTO",
          },
          { transaction: t }
        );

        if (userPortfolio) {
          return [[undefined, 1]];
        }
        return [[undefined, 0]];
      } else {
        console.log("increment Port");
        const userPortfolio = await Portfolio.increment(colunm, {
          by: amount,
          transaction: t,
          where: { email, symbol },
        });
        return userPortfolio;
      }

    case "open":
      const userOpenTrade = await Open.increment(colunm, {
        by: amount,
        transaction: t,
        where: { email, id: symbol },
      });
      return userOpenTrade;
      break;

    default:
      return null;
  }
};

exports.deduct = async (email, symbol, which, colunm, amount, t) => {
  switch (which) {
    case "portfolio":
      const userPortfolio = await Portfolio.decrement(colunm, {
        by: amount,
        transaction: t,
        where: {
          email,
          symbol,
          value: {
            [Op.gte]: amount,
          },
        },
      });
      return userPortfolio;
    case "in_trade":
      const intrade = await Portfolio.decrement(colunm, {
        by: amount,
        transaction: t,
        where: {
          email,
          symbol,
          in_trade: {
            [Op.gte]: amount,
          },
        },
      });
      return intrade;
    case "open":
      const userOpenTrade = await Open.decrement(colunm, {
        by: amount,
        transaction: t,
        where: { email, id: symbol },
      });
      return userOpenTrade;
      break;

    default:
      return null;
  }
};

exports.activity_status = Object.freeze({
  success: "SUCCESS",
  failure: "FAILURE",
});

exports.activity_tunnel = Object.freeze({
  user: "USER",
  admin: "ADMIN",
});
