import {
  User,
  Asset,
  Transactions,
  Notifier,
  ProductPurchases,
  ReferralList,
  Subscriber,
} from "../../models";
import {
  successResponse,
  errorResponse,
  checkBalance,
  tx,
  nt,
  add,
  deduct,
  uniqueId,
  getRan,
  checkLiquidityBalance,
  addToLiquidity,
  deductLiquidity,
  addReferralReward,
  activity_status,
  activity_tunnel,
} from "../../helpers";
import { newActivity } from "../user/user.controller";
import { sendTemplateAlt } from "../../helpers/utils";

const db = require("../../config/sequelize");
const { Op } = require("sequelize");
const axios = require("axios").default;
const instance = axios.create({
  baseURL: process.env.INT,
  timeout: 15000,

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    //'x-api-key': process.env.TIN,
  },
});

const watuAccount = axios.create({
  baseURL: process.env.WATU_BASE_URL,
  timeout: 15000,

  headers: {
    Authorization: "Bearer " + process.env.WATU_SECRET_KEY,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const watuPublic = axios.create({
  baseURL: process.env.WATU_BASE_URL,
  timeout: 15000,

  headers: {
    Authorization: "Bearer " + process.env.WATU_PUBLIC_KEY,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const egorasProduct = axios.create({
  baseURL: "https://egoras-v3-staging.egoras.com/",
  timeout: 15000,

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});
export const settleCashout = async (req, res) => {
  try {
    const pendingTransaction = await Transactions.findAll({
      where: { status: "ADMIN_APPROVED", type: "CASHOUT" },
    });

    pendingTransaction.map(async (cashout, index) => {
      const updateTransaction = await Transactions.update(
        { status: "FAILED" },
        { where: { id: cashout.id } }
      );
      console.log(updateTransaction[0]); //FAILED
      if (updateTransaction[0]) {
        const meta = JSON.parse(cashout.meta);
        const transactionFee = meta.fee;
        const SendMoneyPayload = {
          amount: parseFloat(cashout.amount) - parseFloat(transactionFee),
          account_id: meta.bank_info.account_number.trim(),
          //financial_institution: meta.bank_info.bank_code,
          currency: meta.symbol,
          debit_currency: meta.symbol,
          financial_institution_id: meta.bank_info.bank_code,
          async: true,
          business_signature: process.env.WATU_PIN,
        };
        await watuAccount
          .post("send-money", SendMoneyPayload)
          .then((res) => {
            console.log(res);
            Transactions.update(
              { status: "SUCCESS" },
              { where: { id: cashout.id } }
            );
          })
          .catch((err) => {
            console.log(err.response);
          });
      }
    });
    return successResponse(req, res, {});
  } catch (error) {
    console.log(error);
    return errorResponse(req, res, error.message);
  }
};

export const settleCashoutCrypto = async (req, res) => {
  try {
    const pendingTransaction = await Transactions.findAll({
      where: { status: "ADMIN_APPROVED", type: "WIITHDRAWAL" },
    });

    // console.log(allAssets);

    pendingTransaction.map(async (cashout, index) => {
      console.log(JSON.parse(cashout.meta).wallet_address);
      let walletNew = JSON.parse(cashout.meta).wallet_address;
      let amount = JSON.parse(cashout.meta).to_send;
      let symbol = JSON.parse(cashout.meta).symbol;
      let networks = JSON.parse(cashout.meta).network;

      function removeWhitespace(str) {
        return str.replace(/\s/g, "");
      }

      const wallet = removeWhitespace(walletNew);

      let mainValue = parseFloat(amount) * 1000000000000000000;

      if (symbol === "USD" || symbol === "EGC" || symbol === "ESTA") {
        // const allAssets = await Asset.findOne({
        //   where: { symbol },
        // });

        // console.log(allAssets.contract, "dndnd");
        // console.log(allAssets.contract, "dndnd");

        const updateTransaction = await Transactions.update(
          { status: "FAILED" },
          { where: { id: cashout.id } }
        );
        console.log(updateTransaction[0]); //FAILED

        const lowercaseString = networks.toLowerCase();

        if (symbol === "USD" && lowercaseString === "egochain") {
          const newAsset = await Asset.findOne({
            where: { symbol: symbol + "E" },
          });
          if (updateTransaction[0]) {
            let blockChainPayload = {
              privateKey: process.env.PVCT,
              contractAddress: newAsset.contract,
              method: "transfer",
              rpcURL: "https://mainnet.egochain.org",
              params: [`${wallet}`, `${mainValue}`],
              type: "write",
              abi: [
                {
                  constant: false,
                  inputs: [
                    {
                      name: "_to",
                      type: "address",
                    },
                    {
                      name: "_value",
                      type: "uint256",
                    },
                  ],
                  name: "transfer",
                  outputs: [
                    {
                      name: "",
                      type: "bool",
                    },
                  ],
                  payable: false,
                  stateMutability: "nonpayable",
                  type: "function",
                },
              ],
            };

            // console.log(blockChainPayload);

            // Make a POST request using Axios
            axios
              .post(
                "https://bx.hollox.finance/mcw/send/to/erc20/chains",
                blockChainPayload
                // config
              )
              .then((response) => {
                // Handle successful response here
                console.log("Response data:", response.data.data.data.data);

                let ffff = {
                  ...response.data.data.data.data,
                  ...JSON.parse(cashout.meta),
                };

                if (response.data.success == true) {
                  Transactions.update(
                    { status: "SUCCESS", meta: ffff },
                    { where: { id: cashout.id } }
                  );
                }
              })
              .catch((error) => {
                // Handle error here
                console.error("Error: Withdrawal failed");
              })
              .finally(() => {
                // This block is executed regardless of success or failure
                console.log("Request completed");
              });
          }
        } else if (symbol === "ESTA" && lowercaseString === "egochain") {
          const newAsset = await Asset.findOne({
            where: { symbol: symbol + "E" },
          });
          if (updateTransaction[0]) {
            let blockChainPayload = {
              privateKey: process.env.PVCT,
              contractAddress: newAsset.contract,
              method: "transfer",
              rpcURL: "https://mainnet.egochain.org",
              params: [`${wallet}`, `${mainValue}`],
              type: "write",
              abi: [
                {
                  inputs: [
                    {
                      internalType: "address",
                      name: "to_",
                      type: "address",
                    },
                    {
                      internalType: "uint256",
                      name: "value_",
                      type: "uint256",
                    },
                  ],
                  name: "transfer",
                  outputs: [
                    {
                      internalType: "bool",
                      name: "",
                      type: "bool",
                    },
                  ],
                  stateMutability: "nonpayable",
                  type: "function",
                },
              ],
            };

            // console.log(blockChainPayload);

            // Make a POST request using Axios
            axios
              .post(
                "https://bx.hollox.finance/mcw/send/to/erc20/chains",
                blockChainPayload
                // config
              )
              .then((response) => {
                // Handle successful response here
                console.log("Response data:", response.data.data.data.data);

                let ffff = {
                  ...response.data.data.data.data,
                  ...JSON.parse(cashout.meta),
                };

                if (response.data.success == true) {
                  Transactions.update(
                    { status: "SUCCESS", meta: ffff },
                    { where: { id: cashout.id } }
                  );
                }
              })
              .catch((error) => {
                // Handle error here
                console.error("Error: Withdrawal failed");
              })
              .finally(() => {
                // This block is executed regardless of success or failure
                console.log("Request completed");
              });
          }
        } else if (symbol === "ESTA" && networks === "Ethereum (ERC20)") {
          const newAsset = await Asset.findOne({
            where: { symbol: symbol },
          });
          if (updateTransaction[0]) {
            // contract, address, privateKey, amount;

            let blockChainPayload = {
              privateKey: process.env.PVCT,
              contractAddress: newAsset.contract,
              method: "transfer",
              rpcURL: "https://eth.drpc.org",
              params: [`${wallet}`, `${mainValue}`],
              type: "write",
              abi: [
                {
                  constant: false,
                  inputs: [
                    {
                      name: "_to",
                      type: "address",
                    },
                    {
                      name: "_value",
                      type: "uint256",
                    },
                  ],
                  name: "transfer",
                  outputs: [
                    {
                      name: "",
                      type: "bool",
                    },
                  ],
                  payable: false,
                  stateMutability: "nonpayable",
                  type: "function",
                },
              ],
            };
            // let blockChainPayload = {
            //   privateKey: process.env.PVCT,
            //   contract: newAsset.contract,
            //   amount: mainValue,
            //   address: wallet,
            // };

            // console.log(blockChainPayload);

            // Make a POST request using Axios
            axios
              .post(
                "https://bx.hollox.finance/mcw/send/to/erc20/chains",
                blockChainPayload
                // config
              )
              .then((response) => {
                // Handle successful response here
                console.log("Response data:", response.data.data.data.data);

                let ffff = {
                  ...response.data.data.data.data,
                  ...JSON.parse(cashout.meta),
                };

                if (response.data.success == true) {
                  Transactions.update(
                    { status: "SUCCESS", meta: ffff },
                    { where: { id: cashout.id } }
                  );
                }
              })
              .catch((error) => {
                // Handle error here
                console.error("Error: Withdrawal failed");
              })
              .finally(() => {
                // This block is executed regardless of success or failure
                console.log("Request completed");
              });
          }
        } else {
          const newAsset = await Asset.findOne({
            where: { symbol: symbol },
          });
          if (updateTransaction[0]) {
            let blockChainPayload = {
              privateKey: process.env.PVCT,
              contractAddress: newAsset.contract,
              method: "transfer",
              rpcURL: "https://bsc-dataseed1.binance.org",
              params: [`${wallet}`, `${mainValue}`],
              type: "write",
              abi: [
                {
                  constant: false,
                  inputs: [
                    {
                      name: "_to",
                      type: "address",
                    },
                    {
                      name: "_value",
                      type: "uint256",
                    },
                  ],
                  name: "transfer",
                  outputs: [
                    {
                      name: "",
                      type: "bool",
                    },
                  ],
                  payable: false,
                  stateMutability: "nonpayable",
                  type: "function",
                },
              ],
            };

            // console.log(blockChainPayload);

            // Make a POST request using Axios
            axios
              .post(
                "https://bx.hollox.finance/mcw/send/to/erc20/chains",
                blockChainPayload
                // config
              )
              .then((response) => {
                // Handle successful response here
                console.log("Response data:", response.data.data.data.data);

                let ffff = {
                  ...response.data.data.data.data,
                  ...JSON.parse(cashout.meta),
                };

                if (response.data.success == true) {
                  Transactions.update(
                    { status: "SUCCESS", meta: ffff },
                    { where: { id: cashout.id } }
                  );
                }
              })
              .catch((error) => {
                // Handle error here
                console.error("Error: Withdrawal failed");
              })
              .finally(() => {
                // This block is executed regardless of success or failure
                console.log("Request completed");
              });
          }
        }
      } else {
        const updateTransaction = await Transactions.update(
          { status: "FAILED" },
          { where: { id: cashout.id } }
        );
        console.log(updateTransaction[0]); //FAILED

        if (updateTransaction[0]) {
          let blockChainPayload = {
            recipientAddress: wallet,
            amount: parseFloat(amount),
            network: "ethereum",
            rpcUrl: "https://mainnet.egochain.org",
            privateKey: process.env.EGAXDIS,
          };

          try {
            // Make a POST request using Axios
            await axios
              .post(
                "https://bx.hollox.finance/mcw/send/evm/token",
                blockChainPayload
                // config
              )
              .then((response) => {
                // Handle successful response here
                console.log("Response:", response.data.data);

                let ffff = {
                  ...response.data.data,
                  ...JSON.parse(cashout.meta),
                };
                // console.log(ffff);

                if (response.data.success == true) {
                  Transactions.update(
                    { status: "SUCCESS", meta: ffff },
                    { where: { id: cashout.id } }
                  );
                  console.log("Your EGAX Token is on the way!!");
                  // return successResponse(req, res, {
                  //   message: `Your EGAX Token is on the way!!!`,
                  // });
                }
              })
              .catch((error) => {
                // Handle error here
                console.error("Error: Failed", error);
              });
          } catch (error) {
            console.log(error);
          }
        }
      }
    });
    return successResponse(req, res, {});
  } catch (error) {
    console.log("error");
    console.log(error);
    return errorResponse(req, res, error.message);
  }
};

export const getUser = async (req, res) => {
  try {
    const { username_email } = req.body;
    const getUser = await User.findOne({
      where: {
        [Op.or]: [{ email: username_email }, { username: username_email }],
      },
    });
    if (!getUser) {
      throw new Error("Please this account does not exist!");
    }

    return successResponse(req, res, getUser);
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

export const fortPayNewSub = async (req, res) => {
  try {
    await db.sequelize.transaction(async (fortPayTransaction) => {
      let symbol = req.body.symbol;
      let amount = req.body.amount;

      let checkUserBalance = await checkBalance(req.user.email, amount, symbol);
      if (!checkUserBalance) {
        throw new Error("insufficient funds.");
      }
      let deductSenderValue = await deduct(
        req.user.email,
        symbol,
        "portfolio",
        "value",
        amount,
        fortPayTransaction
      );
      let txPayload = {
        email: req.user.email,
        to_email: req.user.email,
        meta: req.body,
        amount: amount,
        type: "PURCHASE",
        status: "PENDING",
      };
      let createTx = await tx(txPayload, fortPayTransaction);
      if (!deductSenderValue[0][1] && !createTx[0][1]) {
        throw new Error("insufficient funds.");
      }

      var evenPayload = {
        user: req.body.user,
        response: 1,
      };
      return successResponse(req, res, {});
    });
  } catch (error) {
    var eventChannel =
      req.body.type == "membership" ? "subscribe_membership" : "make_payment";

    var evenPayload = {
      user: req.body.user,
      response: 0,
    };

    return errorResponse(req, res, error.message);
  }
};

export const fortPayNew = async (req, res) => {
  const { email } = req.body;
  try {
    // {
    //   type: "membership",
    //   userWallet: account,
    //   quantity: 1,
    //   amount: 4,
    //   symbol: "EGC",
    //   user: account,
    // }

    if (req.body.type == "product") {
      let hasReferral = false;
      let referral_bonus = 0;
      const ticker = "NGN/EGC";
      const [tokenA, tokenB] = ticker.split("/");
      await db.sequelize.transaction(async (fortPayTransaction) => {
        const { type, product_id, index_id, quantity, amount, symbol, user } =
          req.body;
        let checkUserBalance = await checkBalance(
          req.user.email,
          amount,
          symbol
        );
        if (!checkUserBalance) {
          await newActivity({
            user_email: req.user.email,
            message: `FAILED PURCHASE REASEON: Insufficient funds`,
            tunnel: activity_tunnel.user,
            status: activity_status.failure,
            type: "PURCHASE",
          });
          throw new Error("insufficient funds.");
        }
        if (symbol != "NGN") {
          await newActivity({
            user_email: req.user.email,
            message: `FAILED PURCHASE REASEON: Invalid Currency`,
            tunnel: activity_tunnel.user,
            status: activity_status.failure,
            type: "PURCHASE",
          });
          throw new Error("Invalid currency.");
        }
        const fetchLiquidityConditions = {
          tokenASymbol: tokenA,
          tokenBSymbol: tokenB,
        };
        let fetchLiquidity = await checkLiquidityBalance(
          fetchLiquidityConditions
        );
        if (!fetchLiquidity) {
          await newActivity({
            user_email: req.user.email,
            message: `FAILED PURCHASE REASEON: Invalid Transaction`,
            tunnel: activity_tunnel.user,
            status: activity_status.failure,
            type: "PURCHASE",
          });
          throw new Error(`Invalid Transaction!`);
        }
        const referralList = await ReferralList.findOne({
          where: { email: req.user.email },
        });

        console.log(referralList, "**KKKKKKKKK______");

        if (referralList) {
          const subscriber = await Subscriber.findOne({
            where: { email: referralList.email, status: "ACTIVE" },
          });
          if (subscriber) {
            hasReferral = true;
            if (amount < 500000) {
              referral_bonus = amount * 0.1;
            } else if (amount >= 500000) {
              referral_bonus = amount * 0.05;
            }
          }
        }

        const price = fetchLiquidity.tokenA / fetchLiquidity.tokenB;
        // const calculatedAmountOut = amount / price;
        const calculatedAmountOut = (amount - referral_bonus) / price;

        const conditions = {
          tokenB: {
            [Op.gte]: calculatedAmountOut,
          },
          tokenASymbol: tokenA,
          tokenBSymbol: tokenB,
        };

        let checkLiquidityBal = await checkLiquidityBalance(conditions);
        if (!checkLiquidityBal) {
          await newActivity({
            user_email: req.user.email,
            message: `FAILED PURCHASE REASEON: Non-Sufficient Funds. No Liquidity`,
            tunnel: activity_tunnel.user,
            status: activity_status.failure,
            type: "PURCHASE",
          });
          throw new Error(`Non-Sufficient Funds. No Liquidity`);
        }

        //////////////////////////////Do Automatic swap///////////////////////////////////////
        //////////////////////////////Do Automatic swap///////////////////////////////////////

        let deductValue = await deduct(
          req.user.email,
          tokenA,
          "portfolio",
          "value",
          amount,
          fortPayTransaction
        );
        let addValue = await add(
          "support@egoras.com",
          tokenB,
          "portfolio",
          "value",
          calculatedAmountOut,
          fortPayTransaction
        );

        const addConditions = {
          tokenASymbol: tokenA,
          tokenBSymbol: tokenB,
        };
        let addToLiquidityValue = addToLiquidity(
          addConditions,
          "tokenA",
          amount - referral_bonus,
          fortPayTransaction
        );

        const deductConditions = {
          tokenASymbol: tokenA,
          tokenBSymbol: tokenB,
        };

        let deductLiquidityValue = deductLiquidity(
          deductConditions,
          "tokenB",
          calculatedAmountOut,
          fortPayTransaction
        );
        if (
          !deductValue[0][1] &&
          !addValue[0][1] &&
          !addToLiquidityValue[0][1] &&
          !deductLiquidityValue[0][1]
        ) {
          await newActivity({
            user_email: req.user.email,
            message: `PRODUCT PURCHASE FAILED`,
            tunnel: activity_tunnel.user,
            status: activity_status.failure,
            type: "PURCHASE",
          });
          throw new Error("Product purchase failed.");
        }

        if (hasReferral) {
          const referralRewarded = await addReferralReward(
            referralList.referred,
            referral_bonus,
            "PURCHASE",
            fortPayTransaction
          );
          if (!referralRewarded[0][1]) {
            await newActivity({
              user_email: referralList.referred,
              message: `Unable to recieve reward`,
              tunnel: activity_tunnel.user,
              status: activity_status.failure,
              type: "REWARDS",
            });
            throw new Error("Unable to reward");
          }
        }

        /////////////////////////////End of Automatic swap///////////////////////////////////
        /////////////////////////////End of Automatic swap///////////////////////////////////
        const tHax = uniqueId(16);
        const manualPayload = {
          index_id: index_id, // Supply product index_id not product id
          buyer: user, // User wallet address
          quantity: quantity,
          transactionHash: tHax,
        };
        const SendMoneyPayload = {
          user: user,
          product_id: index_id, // Supply product index_id not product id
          quantity: quantity,
          transactionHash: tHax,
          order_type: "DIRECT", // always supply DIRECT
        };
        // let checkUserBalance = await checkBalance(req.user.email,amount,symbol);
        // if(!checkUserBalance){
        //   throw new Error('insufficient funds.');
        // }

        // let deductSenderValue  = await deduct(req.user.email,symbol, "portfolio", "value", amount, fortPayTransaction);

        let txPayload = {
          email: req.user.email,
          to_email: req.user.email,
          meta: { type, product_id, index_id, quantity, amount, symbol, user },
          amount: amount,
          type: "PURCHASE",
          status: "PENDING",
        };
        let createTx = await tx(txPayload, fortPayTransaction);

        // const notification_payload = {
        //   tunnel: activity_tunnel.admin,
        //   email: req.user.email,
        //   meta: { type, product_id, index_id, quantity, amount, symbol, user },
        // };
        // await nt(notification_payload, t);
        //!deductSenderValue[0][1] &&
        if (!createTx[0][1]) {
          await newActivity({
            user_email: req.user.email,
            message: `Unable To Purchase product ${product_id} Reason: Insufficient funds`,
            tunnel: activity_tunnel.user,
            status: activity_status.failure,
            type: "PURCHASE",
          });
          throw new Error("insufficient funds.");
        }

        await egorasProduct
          .post("web3/get/sold/products/manual", manualPayload)
          .then(async (resi) => {
            await egorasProduct
              .post("order/new", SendMoneyPayload)
              .then(async (resi) => {
                var evenPayload = {
                  user: req.body.user,
                  response: 1,
                };

                await ProductPurchases.create(
                  {
                    email: req.user.email,
                    product_id,
                    quantity,
                    amount,
                    type: "PURCHASE",
                  },
                  { transaction: fortPayTransaction }
                );

                const notification_payload = {
                  tunnel: activity_tunnel.admin,
                  email: req.user.email,
                  meta: {
                    type,
                    product_id,
                    index_id,
                    quantity,
                    amount,
                    symbol,
                    user,
                  },
                };
                await nt(notification_payload, fortPayTransaction);

                await newActivity({
                  user_email: req.user.email,
                  message: `Successfully purchased product ${product_id}`,
                  tunnel: activity_tunnel.user,
                  status: activity_status.success,
                  type: "PURCHASE",
                });
                return successResponse(req, res, {});
              })
              .catch(async (err) => {
                console.log(err);
                await newActivity({
                  user_email: req.user.email,
                  message: `Failed reason : ${err}`,
                  tunnel: activity_tunnel.user,
                  status: activity_status.failure,
                  type: "PURCHASE",
                });
                throw new Error("Failed 1");
              });
          })
          .catch(async (err) => {
            console.log(err);
            await newActivity({
              user_email: req.user.email,
              message: `Failed reason : ${err}`,
              tunnel: activity_tunnel.user,
              status: activity_status.failure,
              type: "PURCHASE",
            });
            throw new Error("Failed 2");
          });
      });
    } else {
      await db.sequelize.transaction(async (fortPayTransaction) => {
        let symbol = req.body.symbol;
        let amount = req.body.amount;
        var eventChannel =
          req.body.type == "membership"
            ? "subscribe_membership"
            : "make_payment";

        let checkUserBalance = await checkBalance(
          req.user.email,
          amount,
          symbol
        );
        if (!checkUserBalance) {
          throw new Error("insufficient funds.");
        }
        let deductSenderValue = await deduct(
          req.user.email,
          symbol,
          "portfolio",
          "value",
          amount,
          fortPayTransaction
        );
        let txPayload = {
          email: req.user.email,
          to_email: req.user.email,
          meta: req.body,
          amount: amount,
          type: "PURCHASE",
          status: "PENDING",
        };

        let createTx = await tx(txPayload, fortPayTransaction);
        if (!deductSenderValue[0][1] && !createTx[0][1]) {
          throw new Error("insufficient funds.");
        }

        var evenPayload = {
          user: req.body.user,
          response: 1,
        };
        return successResponse(req, res, {});
      });
    }
  } catch (error) {
    console.log(error);
    var eventChannel =
      req.body.type == "membership" ? "subscribe_membership" : "make_payment";

    var evenPayload = {
      user: req.body.user,
      response: 0,
    };

    return errorResponse(req, res, error.message);
  }
};

export const fortPay = async (req, res) => {
  try {
    await db.sequelize.transaction(async (fortPayTransaction) => {
      let symbol = req.body.data[0].data.symbol;
      let amount = req.body.data[0].data.amount;
      var eventChannel =
        req.body.data[0].type == "membership"
          ? "subscribe_membership"
          : "make_payment";

      let checkUserBalance = await checkBalance(req.user.email, amount, symbol);
      if (!checkUserBalance) {
        throw new Error("insufficient funds.");
      }
      let deductSenderValue = await deduct(
        req.user.email,
        symbol,
        "portfolio",
        "value",
        amount,
        fortPayTransaction
      );
      let txPayload = {
        email: req.user.email,
        to_email: req.user.email,
        meta: req.body.data[0],
        amount: amount,
        type: "PURCHASE",
        status: "PENDING",
      };
      let createTx = await tx(txPayload, fortPayTransaction);
      if (!deductSenderValue[0][1] && !createTx[0][1]) {
        throw new Error("insufficient funds.");
      }

      var evenPayload = {
        user: req.body.data[0].data.user,
        response: 1,
      };
      return successResponse(req, res, {});
    });
  } catch (error) {
    var eventChannel =
      req.body.data[0].type == "membership"
        ? "subscribe_membership"
        : "make_payment";

    var evenPayload = {
      user: req.body.data[0].data.user,
      response: 0,
    };

    return errorResponse(req, res, error.message);
  }
};

export const int = async (req, res) => {
  let sendTransaction;
  try {
    const { int, symbol } = req.body;
    let result = await instance.get("v1/order/process/app/payment/" + int);

    if (result.data.success == true) {
      let amount = 0;
      let p = result.data.data.products;
      for (var key in p) {
        amount += parseFloat(p[key].amount);
      }

      let checkUserBalance = await checkBalance(req.user.email, amount, "NGN");
      if (!checkUserBalance) {
        throw new Error("insufficient funds.");
      }
      sendTransaction = await db.sequelize.transaction();
      let deductSenderValue = await deduct(
        req.user.email,
        "",
        "portfolio",
        "value",
        amount,
        sendTransaction
      );
      let uniqueIdData = uniqueId();
      let txPayload = {
        email: req.user.email,
        to_email: req.user.email,
        product: int,
        hash: uniqueIdData,
        usr: result.data.user_id,
        meta: p,
        amount: amount,
        type: "PURCHASE",
        status: "PENDING",
      };
      let createTx = await tx(txPayload, sendTransaction);

      let postData = {
        apiKey: "qqqqqqqqqq",
        tranHash: uniqueIdData,
        amount: amount,
        user_id: result.data.user_id,
        checkout_id: int,
      };

      await instance.post("v1/order/post/app/payment/response", postData);

      if (!deductSenderValue[0][1] && !createTx[0][1]) {
        throw new Error("insufficient funds.");
      }

      await sendTransaction.commit();
      return successResponse(req, res, {});
    } else {
      throw new Error("Product not found");
    }
  } catch (error) {
    let message = error.message;
    //console.log(error);
    if (error.message == "Request failed with status code 400") {
      message = "Payment gateway error!";
      console.log(error.response.data);
    }
    await sendTransaction.rollback();
    return errorResponse(req, res, error.message);
  }
};

export const internal = async (req, res) => {
  setTimeout(async () => {
    let sendTransaction;
    try {
      sendTransaction = await db.sequelize.transaction();
      const { username_email, symbol, amount } = req.body;
      const getUser = await User.findOne({
        where: {
          [Op.or]: [{ email: username_email }, { username: username_email }],
        },
      });
      if (!getUser) {
        await newActivity({
          user_email: req.user.email,
          message: `FAILED WITHDRAWALS REASON: ${username_email} does not exist`,
          tunnel: activity_tunnel.user,
          status: activity_status.failure,
          type: "WITHDRAWAL",
        });
        throw new Error("Please this account does not exist!");
      }

      if (getUser.email == req.user.email) {
        await newActivity({
          user_email: req.user.email,
          message: `FAILED WITHDRAWALS REASON: Tried sending funds to self! `,
          tunnel: activity_tunnel.user,
          status: activity_status.failure,
          type: "WITHDRAWAL",
        });
        throw new Error("You can not send to yourself!");
      }
      let checkUserBalance = await checkBalance(req.user.email, amount, symbol);
      if (!checkUserBalance) {
        await newActivity({
          user_email: req.user.email,
          message: `FAILED WITHDRAWALS REASON: Insufficient funds to carry out operation`,
          tunnel: activity_tunnel.user,
          status: activity_status.failure,
          type: "WITHDRAWAL",
        });
        throw new Error("insufficient funds.");
      }

      // deducting
      let deductSenderValue = await deduct(
        req.user.email,
        symbol,
        "portfolio",
        "value",
        amount,
        sendTransaction
      );

      // Crediting
      let addRecieverValue = await add(
        getUser.email,
        symbol,
        "portfolio",
        "value",
        amount,
        sendTransaction
      );
      let txPayload = {
        email: req.user.email,
        to_email: getUser.email,
        meta: {
          symbol,
          to_username: getUser.username,
          from_username: req.user.username,
        },
        amount: amount,
        type: "INTERNAL",
        status: "SUCCESS",
      };
      let createTx = await tx(txPayload, sendTransaction);

      let ntPayload = {
        email: getUser.email,
        tunnel: activity_tunnel.user,
        meta: {
          symbol,
          from: req.user.username,
          amount: amount.toString(),
          type: "received",
        },
      };
      let n = {
        email: getUser.email,
        tunnel: activity_tunnel.admin,
        meta: {
          symbol,
          from: req.user.username,
          amount: amount.toString(),
          type: "received",
        },
      };
      let createNt = await nt(ntPayload, sendTransaction);
      await nt(n, sendTransaction);

      if (
        !addRecieverValue[0][1] &&
        !deductSenderValue[0][1] &&
        !createTx[0][1] &&
        !createNt[0][1]
      ) {
        await newActivity({
          user_email: req.user.email,
          message: `FAILED WITHDRAWALS REASON: Insufficient funds`,
          tunnel: activity_tunnel.user,
          status: activity_status.failure,
          type: "WITHDRAWAL",
        });
        throw new Error("insufficient funds.");
      }

      await newActivity({
        user_email: req.user.email,
        message: `Successfully sent ${amount} ${symbol} to ${username_email}`,
        tunnel: activity_tunnel.user,
        status: activity_status.success,
        type: "WITHDRAWAL",
      });
      await newActivity({
        user_email: getUser.email,
        message: `Successfully recieved ${amount} ${symbol} from ${req.user.email}`,
        tunnel: activity_tunnel.user,
        status: activity_status.success,
        type: "DEPOSIT",
      });
      await sendTransaction.commit();
      return successResponse(req, res, {});
    } catch (error) {
      await newActivity({
        user_email: req.user.email,
        message: `FAILED WITHDRAWALS REASON: ${error.message}`,
        tunnel: activity_tunnel.user,
        status: activity_status.failure,
        type: "WITHDRAWAL",
      });
      await sendTransaction.rollback();
      return errorResponse(req, res, error.message);
    }
  }, getRan(1, 1000));
};

export const external = async (req, res) => {
  setTimeout(async () => {
    let sendTransaction;
    try {
      let networkFound = false;
      let min = 0;
      let fee = 0;
      sendTransaction = await db.sequelize.transaction();
      const { network, symbol, amount, wallet_address } = req.body;

      const getAsset = await Asset.findOne({
        where: { symbol },
      });
      if (!getAsset) {
        await newActivity({
          user_email: req.user.email,
          message: `FAILED WITHDRAWALS`,
          tunnel: activity_tunnel.user,
          status: activity_status.failure,
          type: "WITHDRAWAL",
        });
        throw new Error("Please this account does not exist!");
      }

      // console.log(getAsset);

      let assetNetworks = JSON.parse(getAsset.networks);
      for (let index = 0; index < assetNetworks.length; index++) {
        const element = assetNetworks[index];

        console.log(element);

        if (element.name == network) {
          min = parseFloat(element.min_out.toString() ?? "0.00");
          fee = parseFloat(element.fee.toString() ?? "0.00");
          networkFound = true;
          break;
        }
      }

      if (!networkFound && !fee > 0) {
        await newActivity({
          user_email: req.user.email,
          message: `FAILED WITHDRAWALS REASON: USER SELECTED INVALID NETWORK`,
          tunnel: activity_tunnel.user,
          status: activity_status.failure,
          type: "WITHDRAWAL",
        });
        throw new Error("Invalid network.");
      }

      if (min > parseFloat(amount)) {
        throw new Error("Minimum withdrawal is: " + min + ".");
      }

      if (fee >= parseFloat(amount)) {
        await newActivity({
          user_email: req.user.email,
          message: `FAILED WITHDRAWALS REASON: INSUFFICIENT BALANCE`,
          tunnel: activity_tunnel.user,
          status: activity_status.failure,
          type: "WITHDRAWAL",
        });
        throw new Error("Invalid transaction!");
      }
      let checkUserBalance;
      let finalSymbol = "";
      if (symbol === "USDE") {
        finalSymbol = "USD";
      } else if (symbol === "ESTAE") {
        finalSymbol = "ESTA";
      } else {
        finalSymbol = symbol;
      }

      checkUserBalance = await checkBalance(
        req.user.email,
        amount,
        finalSymbol
      );
      if (!checkUserBalance) {
        await newActivity({
          user_email: req.user.email,
          message: `FAILED WITHDRAWALS REASON: INSUFFICIENT BALANCE`,
          tunnel: activity_tunnel.user,
          status: activity_status.failure,
          type: "WITHDRAWAL",
        });
        throw new Error("Insufficient funds.");
      }

      // deducting
      // deducting
      let deductSenderValue = await deduct(
        req.user.email,
        finalSymbol,
        "portfolio",
        "value",
        amount,
        sendTransaction
      );

      let txPayload = {
        email: req.user.email,
        to_email: req.user.email,
        meta: {
          symbol: finalSymbol,
          network: network,
          fee: fee,
          to_send: amount - fee,
          wallet_address,
        },
        amount: amount,
        type: "WIITHDRAWAL",
        status: "PENDING",
      };
      let createTx = await tx(txPayload, sendTransaction);
      if (!deductSenderValue[0][1] && !createTx[0][1]) {
        await newActivity({
          user_email: req.user.email,
          message: `FAILED WITHDRAWALS REASON: INSUFFICIENT BALANCE`,
          tunnel: activity_tunnel.user,
          status: activity_status.failure,
          type: "WITHDRAWAL",
        });
        throw new Error("Insufficient funds.");
      }

      await sendTransaction.commit();

      await newActivity({
        user_email: req.user.email,
        message: `Successfully sent ${amount} ${symbol} to address ${wallet_address} using ${network} network`,
        tunnel: activity_tunnel.user,
        status: activity_status.success,
        type: "WITHDRAWAL",
      });

      await sendTemplateAlt({
        subject: "Withdrawl request",
        message: `${req.user.email} is requesting withdrawal of ${amount} ${symbol} using ${network} network. Wallet Address is ${wallet_address}`,
      });
      return successResponse(req, res, {});
    } catch (error) {
      console.log(error);
      await newActivity({
        user_email: req.user.email,
        message: `FAILED WITHDRAWALS REASON: ${error.message}`,
        tunnel: activity_tunnel.user,
        status: activity_status.failure,
        type: "WITHDRAWAL",
      });
      await sendTransaction.rollback();
      return errorResponse(req, res, error.message);
    }
  }, getRan(1, 1000));
};

export const cashout = async (req, res) => {
  setTimeout(async () => {
    let sendTransaction;
    try {
      let networkFound = false;
      let min = 0;
      let fee = 0;
      sendTransaction = await db.sequelize.transaction();
      const { network, symbol, amount, bank_info } = req.body;
      const { bank_code, account_number, bank_name, account_name } = bank_info;

      const getAsset = await Asset.findOne({
        where: { symbol, has_cashout: true },
      });
      if (!getAsset) {
        await newActivity({
          user_email: req.user.email,
          message: `FAILED WITHDRAWALS REASON: Local cashout is not enabled for this asset. `,
          tunnel: activity_tunnel.user,
          status: activity_status.failure,
          type: "WITHDRAWAL",
        });
        throw new Error("Local cashout is not enabled for this asset.");
      }

      let assetNetworks = JSON.parse(getAsset.networks);

      for (let index = 0; index < assetNetworks.length; index++) {
        const element = assetNetworks[index];

        if (element.name == "Local") {
          min = parseFloat(element.min_out.toString() ?? "0.00");
          fee = parseFloat(element.fee.toString() ?? "0.00");
          networkFound = true;
          break;
        }
      }

      if (!networkFound && !fee > 0) {
        await newActivity({
          user_email: req.user.email,
          message: `FAILED WITHDRAWALS REASON: Local cashout is not enabled for this asset. `,
          tunnel: activity_tunnel.user,
          status: activity_status.failure,
          type: "WITHDRAWAL",
        });
        throw new Error("Local cashout is not enabled for this asset.");
      }

      if (min > parseFloat(amount)) {
        await newActivity({
          user_email: req.user.email,
          message: `FAILED WITHDRAWALS REASON: Minimum withdrawal is: ${min} `,
          tunnel: activity_tunnel.user,
          status: activity_status.failure,
          type: "WITHDRAWAL",
        });
        throw new Error("Minimum withdrawal is: " + min + ".");
      }

      let checkUserBalance = await checkBalance(req.user.email, amount, symbol);
      if (!checkUserBalance) {
        await newActivity({
          user_email: req.user.email,
          message: `FAILED WITHDRAWALS REASON: Insufficient funds `,
          tunnel: activity_tunnel.user,
          status: activity_status.failure,
          type: "WITHDRAWAL",
        });
        throw new Error("insufficient funds.");
      }

      // deducting
      let deductSenderValue = await deduct(
        req.user.email,
        symbol,
        "portfolio",
        "value",
        amount,
        sendTransaction
      );

      let txPayload = {
        email: req.user.email,
        to_email: req.user.email,
        meta: {
          symbol,
          network: network,
          fee: fee,

          bank_info,
        },
        amount: amount,
        type: "CASHOUT",
        status: "PENDING",
      };
      let createTx = await tx(txPayload, sendTransaction);
      if (!deductSenderValue[0][1] && !createTx[0][1]) {
        await newActivity({
          user_email: req.user.email,
          message: `FAILED WITHDRAWALS REASON: Insufficient funds`,
          tunnel: activity_tunnel.user,
          status: activity_status.failure,
          type: "WITHDRAWAL",
        });
        throw new Error("insufficient funds.");
      }

      await sendTransaction.commit();
      await newActivity({
        user_email: req.user.email,
        message: `${req.user.username} successfully withdrew ${amount} ${symbol} to ${account_name} account number: ${account_number} bank : ${bank_name} `,
        tunnel: activity_tunnel.user,
        status: activity_status.success,
        type: "WITHDRAWAL",
      });

      return successResponse(req, res, {});
    } catch (error) {
      await newActivity({
        user_email: req.user.email,
        message: `FAILED WITHDRAWALS REASON: ${error.message}`,
        tunnel: activity_tunnel.user,
        status: activity_status.failure,
        type: "WITHDRAWAL",
      });
      await sendTransaction.rollback();
      return errorResponse(req, res, error.message);
    }
  }, getRan(1, 1000));
};

export const fetch = async (req, res) => {
  try {
    const page = req.params.page > 0 ? req.params.page : 1;
    const limit = parseInt(req.params.limit);
    const offset = (page - 1) * limit;
    let user = req.user.email;
    let query = `call sp_getHistory('${user}', ${offset}, ${limit})`;
    const result = await db.sequelize.query(query);

    return successResponse(req, res, result);
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

export const notification = async (req, res) => {
  try {
    // sendFcmMessage(req.body);
    const getFCMToken = await Notifier.findOne({
      where: { email: req.user.email, token: req.body.token },
    });
    if (!getFCMToken) {
      await Notifier.create({
        email: req.user.email,
        token: req.body.token,
      });
    }
    return successResponse(req, res, {});
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};
