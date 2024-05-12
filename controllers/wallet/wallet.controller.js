const Web3 = require("web3");
const {
  Asset,
  Wallet,
  Watch,
  Deposit,
  User,
  EgoWatch,
  FailedTransaction,
  Transactions,
  Bridge,
} = reuire("../../models");
const { Op } = require("sequelize");
const crypto = require("crypto");
const abi = require("erc-20-abi");
import erc721 from "./erc721.json";
const schedule = require("node-schedule");
const axios = require("axios").default;
const {
  eth,
  bnb,
  ethereumToken,
  binanceToken,
  btc,
  ubtc,
} = require("../../helpers/watch");

const db = require("../../config/sequelize");
var { sendTemplate, sendTemplateAlt } = require("../../helpers/utils");
const {
  successResponse,
  errorResponse,
  checkBalance,
  tx,
  nt,
  add,
  Depoxit,
  UpdatBridge,
  deduct,
  uniqueId,
} = require("../../helpers");
const { log } = require("console");
const { getAblyInstance } = require("../ably/init");

var provider = "https://endpoints.omniatech.io/v1/bsc/mainnet/public";
var provider2 = "https://mainnet.egochain.org";
var provider5 = "https://eth.drpc.org";
// var provider5 = "https://goerli.infura.io/v3/f886689d9bfe48eba96b689bab3d8d74";
var web3 = new Web3(provider);
var web4 = new Web3(provider2);
var web5 = new Web3(provider5);

const instance = axios.create({
  baseURL: process.env.BLOCKCHAIN_ENDPOINT,
  timeout: 15000,

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const instance2 = axios.create({
  baseURL: "https://egoscan.io/",
  timeout: 15000,

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

exports.watchBTC = async (req, res) => {
  try {
    let watches = await Watch.findAll({
      where: {
        symbol: {
          [Op.eq]: "BTC",
        },
      },
      order: [["updatedAt", "DESC"]],
    });

    if (watches) {
      watches.forEach(async (watch) => {
        //console.log(watch.symbol);
        let asset = await Asset.findOne({ where: { symbol: watch.symbol } });

        if (asset.isBase != undefined && asset.isBase == true) {
          switch (watch.symbol) {
            case "BNB":
              await bnb(
                watch.address,
                watch.email,
                watch.symbol,
                watch.block,
                asset.blockchain
              );
              break;
            case "ETH":
              await eth(
                watch.address,
                watch.email,
                watch.symbol,
                watch.block,
                asset.blockchain
              );
              break;

            case "BTC":
              //  await  ubtc(watch.address,watch.email,watch.symbol,watch.block,asset.blockchain);
              await btc(
                watch.address,
                watch.email,
                watch.symbol,
                watch.block,
                asset.blockchain
              );

              break;
            default:
              break;
          }
        } else {
          switch (asset.blockchain) {
            case "BINANCE":
              await binanceToken(
                watch.address,
                watch.email,
                watch.symbol,
                watch.block,
                asset.blockchain,
                asset.contract
              );
              break;
            case "ETHEREUM":
              await ethereumToken(
                watch.address,
                watch.email,
                watch.symbol,
                watch.block,
                asset.blockchain,
                asset.contract
              );

              break;

            default:
              break;
          }
        }
      });
    }
    return successResponse(req, res, {});
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

exports.watchUnconfirmedBTC = async (req, res) => {
  try {
    let watches = await Watch.findAll({
      where: {
        symbol: {
          [Op.eq]: "BTC",
        },
      },
      order: [["updatedAt", "DESC"]],
    });

    if (watches) {
      watches.forEach(async (watch) => {
        //console.log(watch.symbol);
        let asset = await Asset.findOne({ where: { symbol: watch.symbol } });

        if (asset.isBase != undefined && asset.isBase == true) {
          switch (watch.symbol) {
            case "BNB":
              await bnb(
                watch.address,
                watch.email,
                watch.symbol,
                watch.block,
                asset.blockchain
              );
              break;
            case "ETH":
              await eth(
                watch.address,
                watch.email,
                watch.symbol,
                watch.block,
                asset.blockchain
              );
              break;

            case "BTC":
              await ubtc(
                watch.address,
                watch.email,
                watch.symbol,
                watch.block,
                asset.blockchain
              );
              //await  btc(watch.address,watch.email,watch.symbol,watch.block,asset.blockchain);

              break;
            default:
              break;
          }
        } else {
          switch (asset.blockchain) {
            case "BINANCE":
              await binanceToken(
                watch.address,
                watch.email,
                watch.symbol,
                watch.block,
                asset.blockchain,
                asset.contract
              );
              break;
            case "ETHEREUM":
              await ethereumToken(
                watch.address,
                watch.email,
                watch.symbol,
                watch.block,
                asset.blockchain,
                asset.contract
              );

              break;

            default:
              break;
          }
        }
      });
    }
    return successResponse(req, res, {});
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

exports.watch = async (req, res) => {
  try {
    const fifteenMinutesAgo = new Date(new Date() - 15 * 60 * 1000);

    let watches = await Watch.findAll({
      where: {
        symbol: {
          [Op.notIn]: ["BTC", "EGC", "EGAX", "USDT"],
        },
        // updatedAt: {
        //   [Op.lte]: fifteenMinutesAgo,
        // },
      },
      order: [
        ["id", "DESC"],
        ["updatedAt", "DESC"],
      ],
    });

    // console.log("MMM");
    let mainWatches = [];

    if (watches) {
      const promises = watches.map(async (watch) => {
        // if (watch.symbol !== "USD") {
        //   console.log(watch.symbol, "HHJJJOk");
        // }
        let asset = await Asset.findOne({ where: { symbol: watch.symbol } });

        if (asset) {
          mainWatches.push({
            address: watch.address,
            email: watch.email,
            symbol: watch.symbol,
            block: watch.block,
            blockchain: asset.blockchain,
            contract: asset.contract,
            isBase: asset.isBase,
          });
        }
      });

      // Wait for all promises to resolve
      await Promise.all(promises);
    }

    let chunkSize = 30;
    let groupedArrays = [];

    for (let i = 0; i < mainWatches.length; i += chunkSize) {
      let chunk = mainWatches.slice(i, i + chunkSize);
      groupedArrays.push(chunk);
    }

    groupedArrays.map((firstLoop, index) => {
      // console.log("kklll");
      setTimeout(async () => {
        console.log("Iteration", index + 1);
        firstLoop.forEach(async (watch) => {
          if (watch.isBase != undefined && watch.isBase == true) {
            console.log("LLLLLL");
            switch (watch.symbol) {
              case "BNB":
                await bnb(
                  watch.address,
                  watch.email,
                  watch.symbol,
                  watch.block,
                  watch.blockchain
                );
                break;
              case "ETH":
                await eth(
                  watch.address,
                  watch.email,
                  watch.symbol,
                  watch.block,
                  watch.blockchain
                );
                break;
              case "BTC":
                //  await  ubtc(watch.address,watch.email,watch.symbol,watch.block,asset.blockchain);
                await btc(
                  watch.address,
                  watch.email,
                  watch.symbol,
                  watch.block,
                  watch.blockchain
                );

                break;
              default:
                break;
            }
          } else {
            switch (watch.blockchain) {
              case "BINANCE":
                console.log("FFFF");
                await binanceToken(
                  watch.address,
                  watch.email,
                  watch.symbol,
                  watch.block,
                  watch.blockchain,
                  watch.contract
                );
                break;
              case "ETHEREUM":
                console.log("ETHEREUM");
                await ethereumToken(
                  watch.address,
                  watch.email,
                  watch.symbol,
                  watch.block,
                  watch.blockchain,
                  watch.contract
                );

                break;

              default:
                break;
            }
          }
        });
      }, 5000);
    });

    // watches.forEach(async (watch) => {
    //   //console.log(watch.symbol);
    //   let asset = await Asset.findOne({ where: { symbol: watch.symbol } });
    //   // console.log(asset, "kkkLLL");
    //   if (asset) {
    //     console.log("KKK");
    //     if (asset.isBase != undefined && asset.isBase == true) {
    //       console.log("LLLLLL");
    //       switch (watch.symbol) {
    //         case "BNB":
    //           await bnb(
    //             watch.address,
    //             watch.email,
    //             watch.symbol,
    //             watch.block,
    //             asset.blockchain
    //           );
    //           break;
    //         case "ETH":
    //           await eth(
    //             watch.address,
    //             watch.email,
    //             watch.symbol,
    //             watch.block,
    //             asset.blockchain
    //           );
    //           break;
    //         case "BTC":
    //           //  await  ubtc(watch.address,watch.email,watch.symbol,watch.block,asset.blockchain);
    //           await btc(
    //             watch.address,
    //             watch.email,
    //             watch.symbol,
    //             watch.block,
    //             asset.blockchain
    //           );

    //           break;
    //         default:
    //           break;
    //       }
    //     } else {
    //       switch (asset.blockchain) {
    //         case "BINANCE":
    //           console.log("FFFF");
    //           await binanceToken(
    //             watch.address,
    //             watch.email,
    //             watch.symbol,
    //             watch.block,
    //             asset.blockchain,
    //             asset.contract
    //           );
    //           break;
    //         case "ETHEREUM":
    //           console.log("ETHEREUM");
    //           await ethereumToken(
    //             watch.address,
    //             watch.email,
    //             watch.symbol,
    //             watch.block,
    //             asset.blockchain,
    //             asset.contract
    //           );

    //           break;

    //         default:
    //           break;
    //       }
    //     }
    //   }
    // });
    return successResponse(req, res, {});
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

exports.watchEgax = async (req, res) => {
  try {
    // Calculate the timestamp 15 minutes ago
    const fifteenMinutesAgo = new Date(new Date() - 15 * 60 * 1000);
    let watches = await Watch.findAll({
      where: {
        symbol: {
          [Op.eq]: "EGAX",
        },
        // updatedAt: {
        //   [Op.lte]: fifteenMinutesAgo,
        // },
      },
      order: [
        ["id", "DESC"],
        ["updatedAt", "DESC"],
      ],
    });
    // console.log(watches);

    if (watches) {
      let mainWatches = [];
      // console.log("BBBB");
      if (watches) {
        // Map watches to an array of promises
        const promises = watches.map(async (watch) => {
          let asset = await Asset.findOne({ where: { symbol: watch.symbol } });
          if (asset) {
            mainWatches.push({
              address: watch.address,
              email: watch.email,
              symbol: watch.symbol,
              block: watch.block,
            });
          }
        });

        // Wait for all promises to resolve
        await Promise.all(promises);
      }
      // console.log(mainWatches);

      let chunkSize = 20;
      let groupedArrays = [];

      for (let i = 0; i < mainWatches.length; i += chunkSize) {
        let chunk = mainWatches.slice(i, i + chunkSize);
        groupedArrays.push(chunk);
      }

      // console.log(groupedArrays, "final");

      groupedArrays.map((firstLoop, index) => {
        console.log("kklll");
        setTimeout(() => {
          console.log("Iteration", index + 1);
          firstLoop.forEach(async (watch) => {
            console.log(watch, "ijiji");

            let startBlock = watch.block;
            let endBlock = watch.block + 10;

            let result = await instance2.get(
              "api?module=account&action=txlist&startblock=" +
                startBlock +
                "&" +
                endBlock +
                "=latest&page=1&offset=5&sort=asc&address=" +
                watch.address
            );

            console.log(result.data.result);
            result.data.result.forEach(async (deposit) => {
              console.log(deposit.confirmations);
              console.log(deposit.to);

              await db.sequelize.transaction(async (addDeposit) => {
                if (deposit.to.toLowerCase() == watch.address.toLowerCase()) {
                  let findDepositHash = await Deposit.findOne({
                    where: { hash: deposit.hash },
                  });
                  if (!findDepositHash) {
                    let amount = parseInt(deposit.value) / 1000000000000000000;
                    let addFund = await add(
                      watch.email,
                      watch.symbol,
                      "portfolio",
                      "value",
                      amount,
                      addDeposit
                    );
                    const enterHash = await Deposit.create(
                      {
                        hash: deposit.hash,
                        blockchain: "EGOCHAIN",
                      },
                      { transaction: addDeposit }
                    );

                    let ntPayload = {
                      email: watch.email,
                      meta: {
                        symbol: watch.symbol,
                        amount: amount.toString(),
                        type: "deposit",
                      },
                    };
                    let createNt = await nt(ntPayload, addDeposit);

                    let txPayload = {
                      email: watch.email,
                      to_email: watch.email,
                      meta: {
                        symbol: watch.symbol,
                        txh: deposit.hash,
                        confirmation: "3/3",
                        network: "EGOCHAIN",
                        wallet_address: deposit.to,
                      },

                      amount: amount,
                      type: "DEPOSIT",
                      status: "SUCCESS",
                    };
                    let createTx = await tx(txPayload, addDeposit);
                    let updateWatch = await Watch.update(
                      { block: deposit.blockNumber },
                      { where: { symbol: watch.symbol, email: watch.email } }
                    );
                    if (
                      !addFund[0][1] &&
                      !enterHash &&
                      !createNt[0][1] &&
                      !createTx[0][1] &&
                      !updateWatch[0][1]
                    ) {
                      addDeposit.rollback();
                    } else {
                      let userPayload = await User.findOne({
                        where: { email: watch.email },
                      });
                      if (userPayload) {
                        var dynamic_template_data = {
                          amount: amount,
                          symbol: watch.symbol,
                          subject: "Egax Deposit Confirmation",
                          name:
                            userPayload.firstName + ", " + userPayload.lastName,
                        };
                        sendTemplate(
                          watch.email,
                          process.env.FROM,
                          process.env.DEPOSIT_TEMPLATE_ID,
                          dynamic_template_data
                        );

                        //  throw new Error('');
                      } else {
                        throw new Error("");
                      }
                    }
                  }
                } else {
                  throw new Error("");
                }
              });
            });
          });
        }, index * 5000);
      });
    }

    return successResponse(req, res, {});
  } catch (error) {
    console.log(error);
    return errorResponse(req, res, error.message);
  }
};

exports.watchEgochainUSDT = async (req, res) => {
  try {
    // Calculate the timestamp 15 minutes ago
    const fifteenMinutesAgo = new Date(new Date() - 15 * 60 * 1000);
    let watches = await EgoWatch.findAll({
      where: { symbol: "USD" },
      order: [
        ["id", "DESC"],
        ["updatedAt", "DESC"],
      ],
    });
    // console.log(watches);

    // if (watches) {
    let mainWatches = [];
    // console.log("BBBB");
    if (watches) {
      // Map watches to an array of promises
      const promises = watches.map(async (watch) => {
        let asset = await Asset.findOne({ where: { symbol: watch.symbol } });
        if (asset) {
          mainWatches.push({
            address: watch.address,
            email: watch.email,
            symbol: watch.symbol,
            block: watch.block,
          });
        }
      });

      // Wait for all promises to resolve
      await Promise.all(promises);
    }

    let chunkSize = 30;
    let groupedArrays = [];

    for (let i = 0; i < mainWatches.length; i += chunkSize) {
      let chunk = mainWatches.slice(i, i + chunkSize);
      groupedArrays.push(chunk);
    }

    groupedArrays.map((firstLoop, index) => {
      // console.log("kklll");
      setTimeout(() => {
        console.log("Iteration", index + 1);
        firstLoop.forEach(async (watch) => {
          // console.log(watch.symbol);
          let asset = await Asset.findOne({
            where: { symbol: watch.symbol + "E", blockchain: "EGOCHAIN" },
          });
          // console.log(asset, "kkkLLL");
          if (asset) {
            try {
              let result = await instance2.get(
                "api?module=account&action=tokentx&address=" +
                  watch.address +
                  "&page=1&offset=1000"
              );

              let blockNumber = await web4.eth.getBlockNumber();

              if (result.data.result.length > 0) {
                result.data.result.forEach(async (deposit, index) => {
                  setTimeout(async () => {
                    // console.log(deposit.hash, "ldddddl,");
                    // console.log(deposit);
                    // console.log(deposit);

                    await db.sequelize.transaction(async (addDeposit) => {
                      try {
                        if (
                          deposit.to.toLowerCase() ==
                          watch.address.toLowerCase()
                        ) {
                          let findDepositHash = await Deposit.findOne({
                            where: { hash: deposit.hash },
                          });
                          if (!findDepositHash) {
                            let amount = 0;
                            if (watch.symbol === "ESTA") {
                              amount =
                                parseInt(deposit.value) / 1000000000000000000;
                            } else {
                              amount =
                                parseInt(deposit.value) / 1000000000000000000;
                            }

                            let addFund = await add(
                              watch.email,
                              watch.symbol,
                              "portfolio",
                              "value",
                              amount,
                              addDeposit
                            );
                            const enterHash = await Deposit.create(
                              {
                                hash: deposit.hash,
                                blockchain: "EGOCHAIN",
                                createdAt: new Date(),
                                updatedAt: new Date(),
                              },
                              { transaction: addDeposit }
                            );

                            let ntPayload = {
                              email: watch.email,
                              meta: {
                                symbol: watch.symbol,
                                amount: amount.toString(),
                                type: "deposit",
                              },
                            };

                            let createNt = await nt(ntPayload, addDeposit);

                            let txPayload = {
                              email: watch.email,
                              to_email: watch.email,
                              meta: {
                                symbol: watch.symbol,
                                txh: deposit.hash,
                                confirmation: "3/3",
                                network: "EGOCHAIN",
                                wallet_address: deposit.to,
                              },

                              amount: amount,
                              type: "DEPOSIT",
                              status: "SUCCESS",
                            };

                            // console.log(txPayload, "ddsdaadde");
                            let createTx = await tx(txPayload, addDeposit);

                            if (
                              !addFund[0][1] ||
                              !enterHash ||
                              !createNt[0][1] ||
                              !createTx[0][1]
                            ) {
                              console.log("______))))))000");
                              addDeposit.rollback();
                            } else {
                              let userPayload = await User.findOne({
                                where: { email: watch.email },
                              });

                              console.log("User Does Not Exist");
                              if (userPayload) {
                                var dynamic_template_data = {
                                  amount: amount,
                                  symbol: watch.symbol,
                                  subject: "Egax Deposit Confirmation",
                                  name:
                                    userPayload.firstName +
                                    ", " +
                                    userPayload.lastName,
                                };
                                sendTemplate(
                                  watch.email,
                                  process.env.FROM,
                                  process.env.DEPOSIT_TEMPLATE_ID,
                                  dynamic_template_data
                                );

                                //  throw new Error('');
                              } else {
                                throw new Error("22");
                              }
                            }
                          }
                        } else {
                          throw new Error("11");
                        }
                      } catch (error) {
                        console.log(error);
                      }
                    });
                  }, 10000);
                });
              } else {
                if (parseInt(watch.block) + 4899 > blockNumber) {
                  await EgoWatch.update(
                    { block: blockNumber },
                    { where: { symbol: watch.symbol, email: watch.email } }
                  );
                } else {
                  await EgoWatch.update(
                    { block: parseInt(watch.block) + 4899 },
                    { where: { symbol: watch.symbol, email: watch.email } }
                  );
                }
              }
            } catch (error) {
              // Handle the error here
              console.error("Error occurred:", error.message);
              // console.log(watch.address, "failed addresses");

              const checkFailed = await FailedTransaction.findOne({
                where: { address: watch.address },
              });

              // console.log(checkFailed);

              if (checkFailed == null && watch.symbol === "USD") {
                console.log("type is null");
                await FailedTransaction.create({
                  address: watch.address,
                });
              }
            }
          }
        });
      }, 5000);
    });

    // }
    return successResponse(req, res, {});
  } catch (error) {
    console.log(error, "ssssss");
    return errorResponse(req, res, error.message);
  }
};

exports.watchEgochainESTA = async (req, res) => {
  try {
    // Calculate the timestamp 15 minutes ago
    const fifteenMinutesAgo = new Date(new Date() - 15 * 60 * 1000);
    let watches = await EgoWatch.findAll({
      where: { symbol: "ESTA" },
      order: [
        ["id", "DESC"],
        ["updatedAt", "DESC"],
      ],
    });
    // console.log(watches);

    // if (watches) {
    let mainWatches = [];
    // console.log("BBBB");
    if (watches) {
      // Map watches to an array of promises
      const promises = watches.map(async (watch) => {
        let asset = await Asset.findOne({ where: { symbol: watch.symbol } });
        if (asset) {
          mainWatches.push({
            address: watch.address,
            email: watch.email,
            symbol: watch.symbol,
            block: watch.block,
          });
        }
      });

      // Wait for all promises to resolve
      await Promise.all(promises);
    }

    let chunkSize = 30;
    let groupedArrays = [];

    for (let i = 0; i < mainWatches.length; i += chunkSize) {
      let chunk = mainWatches.slice(i, i + chunkSize);
      groupedArrays.push(chunk);
    }

    groupedArrays.map((firstLoop, index) => {
      // console.log("kklll");
      setTimeout(() => {
        console.log("Iteration", index + 1);
        firstLoop.forEach(async (watch) => {
          // console.log(watch.symbol);
          let asset = await Asset.findOne({
            where: { symbol: watch.symbol + "E", blockchain: "EGOCHAIN" },
          });
          // console.log(asset, "kkkLLL");
          // console.log(asset, "kkkLLL");
          if (asset) {
            try {
              let instance = new web4.eth.Contract(erc721, asset.contract);

              const options = {
                filter: {
                  to: watch.address,
                },
                fromBlock: parseInt(watch.block) + 1,
                toBlock: parseInt(watch.block) + 3000,
              };

              let returned_event = [];
              returned_event = await instance.getPastEvents(
                "Transfer",
                options
              );
              let blockNumber = await web4.eth.getBlockNumber();

              // console.log(returned_event, "POOOy", blockNumber);

              if (returned_event.length > 0) {
                returned_event.forEach(async (deposit, index) => {
                  try {
                    if (deposit.returnValues.to !== undefined) {
                      await db.sequelize.transaction(async (addDeposit) => {
                        // console.log(deposit.returnValues.to, "jkjkjkji");
                        // console.log(watch.address, "jkjkjkji");
                        // console.log(deposit.returnValues.length);
                        if (
                          deposit.returnValues.to.toLowerCase() ==
                          watch.address.toLowerCase()
                        ) {
                          let findDepositHash = await Deposit.findOne({
                            where: { hash: deposit.transactionHash },
                          });
                          if (!findDepositHash) {
                            let amount = 0;
                            amount =
                              parseInt(deposit.returnValues.amount) /
                              1000000000000000000;

                            let addFund = await add(
                              watch.email,
                              watch.symbol,
                              "portfolio",
                              "value",
                              amount,
                              addDeposit
                            );

                            let depPayload = {
                              hash: deposit.transactionHash,
                              blockchain: "EGOCHAIN",
                            };
                            let enterHash = await Depoxit(
                              depPayload,
                              addDeposit
                            );

                            // const enterHash = await Deposit.create(
                            //   {
                            //     hash: deposit.transactionHash,
                            //     blockchain: "EGOCHAIN",
                            //   },
                            //   { transaction: addDeposit }
                            // );

                            let ntPayload = {
                              email: watch.email,
                              meta: {
                                symbol: watch.symbol,
                                amount: amount.toString(),
                                type: "deposit",
                              },
                            };
                            let createNt = await nt(ntPayload, addDeposit);

                            let txPayload = {
                              email: watch.email,
                              to_email: watch.email,
                              meta: {
                                symbol: watch.symbol,
                                txh: deposit.transactionHash,
                                confirmation: "3/3",
                                network: "EGOCHAIN",
                                wallet_address: deposit.to,
                              },

                              amount: amount,
                              type: "DEPOSIT",
                              status: "SUCCESS",
                            };
                            let createTx = await tx(txPayload, addDeposit);
                            let updateWatch = await EgoWatch.update(
                              { block: deposit.blockNumber },
                              {
                                where: {
                                  symbol: watch.symbol,
                                  email: watch.email,
                                },
                                transaction: addDeposit,
                              }
                            );

                            console.log(
                              deposit.blockNumber,
                              addFund[0][1],
                              enterHash[0][1],
                              createNt[0][1],
                              createTx[0][1],
                              updateWatch[0]
                            );
                            if (
                              !addFund[0][1] &&
                              !enterHash[0][1] &&
                              !createNt[0][1] &&
                              !createTx[0][1] &&
                              !updateWatch[0]
                            ) {
                              console.log("kjoijoijoi");
                              addDeposit.rollback();
                            } else {
                              let userPayload = await User.findOne({
                                where: { email: watch.email },
                              });

                              console.log("User Does Not Exist");
                              if (userPayload) {
                                var dynamic_template_data = {
                                  amount: amount,
                                  symbol: watch.symbol,
                                  subject: "Egax Deposit Confirmation",
                                  name:
                                    userPayload.firstName +
                                    ", " +
                                    userPayload.lastName,
                                };
                                sendTemplate(
                                  watch.email,
                                  process.env.FROM,
                                  process.env.DEPOSIT_TEMPLATE_ID,
                                  dynamic_template_data
                                );

                                //  throw new Error('');
                              } else {
                                throw new Error("22");
                              }
                            }
                          }
                        } else {
                          throw new Error("11");
                        }
                      });
                    }
                  } catch (error) {
                    console.log(error, "hkhjj");
                  }
                });
              } else {
                if (parseInt(watch.block) + 4899 > blockNumber) {
                  await EgoWatch.update(
                    { block: blockNumber },
                    { where: { symbol: watch.symbol, email: watch.email } }
                  );
                } else {
                  await EgoWatch.update(
                    { block: parseInt(watch.block) + 4899 },
                    { where: { symbol: watch.symbol, email: watch.email } }
                  );
                }
              }
            } catch (error) {
              // Handle the error here
              console.error("Error occurred:", error.message);
              // console.log(watch.address, "failed addresses");

              const checkFailed = await FailedTransaction.findOne({
                where: { address: watch.address },
              });

              // console.log(checkFailed);

              if (checkFailed == null && watch.symbol === "USD") {
                console.log("type is null");
                await FailedTransaction.create({
                  address: watch.address,
                });
              }
            }
          }
        });
      }, 5000);
    });

    // }
    return successResponse(req, res, {});
  } catch (error) {
    console.log(error, "ssssss");
    return errorResponse(req, res, error.message);
  }
};

exports.BridgeWatch = async (req, res) => {
  try {
    // Calculate the timestamp 15 minutes ago
    const fifteenMinutesAgo = new Date(new Date() - 15 * 60 * 1000);
    let watches = await Bridge.findAll({
      where: { status: "CONFIRMING", isCron: "ALIVE" },
      order: [
        ["id", "DESC"],
        ["updatedAt", "DESC"],
      ],
    });
    console.log(watches, "jgjkfjhfj");

    if (watches) {
      let mainWatches = [];
      // console.log("BBBB");
      if (watches) {
        // Map watches to an array of promises
        const promises = watches.map(async (watch) => {
          let asset = await Asset.findOne({
            where: { symbol: watch.tickerIn },
          });
          if (asset) {
            mainWatches.push({
              address: watch.user_wallet,
              email: watch.email,
              symbol: watch.tickerIn,
              symbolOut: watch.tickerOut,
              block: watch.blockNumber,
              blockchain: watch.networkIn,
              blockchainOut: watch.networkOut,
              user_wallet: watch.user_wallet,
              recieving_wallet: watch.recieving_wallet,
              tokenAamount: watch.tokenAamount,
              tokenBamount: watch.tokenBamount,
              txnId: watch.txnId,
            });
          }
        });

        // Wait for all promises to resolve
        await Promise.all(promises);
      }

      console.log(mainWatches, "fffl");

      let chunkSize = 30;
      let groupedArrays = [];

      for (let i = 0; i < mainWatches.length; i += chunkSize) {
        let chunk = mainWatches.slice(i, i + chunkSize);
        groupedArrays.push(chunk);
      }

      groupedArrays.map((firstLoop, index) => {
        // console.log("kklll");
        setTimeout(() => {
          console.log("Iteration", index + 1);
          firstLoop.forEach(async (watch) => {
            // console.log(watch.symbol);
            let asset = await Asset.findOne({
              where: { symbol: watch.symbol, blockchain: watch.blockchain },
            });
            // console.log(asset, "kkkLLL");
            // console.log(asset, "kkkLLL");
            if (asset) {
              if (watch.symbol === "USD") {
                try {
                  console.log(asset.contract);
                  let instance = new web3.eth.Contract(abi, asset.contract);

                  const options = {
                    filter: {
                      to: watch.address,
                    },
                    fromBlock: parseInt(watch.block) + 1,
                    toBlock: parseInt(watch.block) + 3000,
                  };

                  let returned_event = [];
                  returned_event = await instance.getPastEvents(
                    "Transfer",
                    options
                  );
                  // let blockNumber = await web4.eth.getBlockNumber();

                  console.log(returned_event, "POOOy");

                  if (returned_event.length > 0) {
                    returned_event.forEach(async (deposit, index) => {
                      try {
                        if (deposit.returnValues.to !== undefined) {
                          await db.sequelize.transaction(async (addDeposit) => {
                            // console.log(deposit.returnValues.length);
                            if (
                              deposit.returnValues.to.toLowerCase() ==
                              watch.address.toLowerCase()
                            ) {
                              let findDepositHash = await Deposit.findOne({
                                where: { hash: deposit.transactionHash },
                              });
                              if (!findDepositHash) {
                                let amount = 0;
                                amount =
                                  parseInt(deposit.returnValues.value) /
                                  1000000000000000000;

                                let depPayload = {
                                  hash: deposit.transactionHash,
                                  blockchain: watch.blockchain,
                                };
                                let enterHash = await Depoxit(
                                  depPayload,
                                  addDeposit
                                );

                                let upDBridge = await UpdatBridge(
                                  watch.txnId,
                                  addDeposit
                                );

                                let ntPayload = {
                                  email: watch.email,
                                  meta: {
                                    symbol: watch.symbol,
                                    amount: amount.toString(),
                                    type: "deposit",
                                  },
                                };
                                let createNt = await nt(ntPayload, addDeposit);
                                const percentage = 0.01; // 0.3% expressed as a decimal

                                const deduction = amount * percentage;
                                const finalAmount = amount - deduction;

                                let txDeposit = {
                                  email: watch.email,
                                  to_email: watch.email,
                                  meta: {
                                    symbol: watch.symbol,
                                    txh: deposit.transactionHash,
                                    confirmation: "3/3",
                                    network: watch.blockchain,
                                    wallet_address: deposit.to,
                                    txnId: watch.txnId,
                                  },

                                  amount: amount,
                                  type: "DEPOSIT",
                                  status: "SUCCESS",
                                };

                                let txWithdrawal = {
                                  email: watch.email,
                                  to_email: watch.email,
                                  meta: {
                                    symbol:
                                      watch.symbolOut === "USDE"
                                        ? "USD"
                                        : watch.symbolOut,
                                    network: watch.blockchainOut,
                                    fee: "1%",
                                    to_send: finalAmount,
                                    wallet_address: watch.recieving_wallet,
                                    txnId: watch.txnId,
                                  },
                                  amount: finalAmount,
                                  type: "WIITHDRAWAL",
                                  status: "PENDING",
                                };
                                let createTx = await tx(txDeposit, addDeposit);
                                let createTx2 = await tx(
                                  txWithdrawal,
                                  addDeposit
                                );
                                const realtime = getAblyInstance();
                                const channel =
                                  realtime.channels.get("bridge-events");
                                await channel.publish(
                                  `${watch.txnId}/deposit/success`,
                                  createTx
                                );

                                await sendTemplateAlt({
                                  subject: " Bridge Withdrawal Request",
                                  message: `${watch.email} made a Bridge Request, and deposited ${amount} ${watch.symbol}  on Network: ${watch.blockchain}. And is requesting withdrawal of ${finalAmount} ${watch.symbolOut} Network: ${watch.blockchainOut}`,
                                });

                                if (
                                  // !addFund[0][1] &&
                                  !enterHash[0][1] &&
                                  !createNt[0][1] &&
                                  !createTx[0][1] &&
                                  !createTx2[0][1] &&
                                  !upDBridge[0][1]
                                ) {
                                  console.log("kjoijoijoi");
                                  addDeposit.rollback();
                                } else {
                                  let userPayload = await User.findOne({
                                    where: { email: watch.email },
                                  });

                                  console.log("User Does Not Exist");
                                  if (userPayload) {
                                    // var dynamic_template_data = {
                                    //   amount: amount,
                                    //   symbol: watch.symbol,
                                    //   subject: "Egax Deposit Confirmation",
                                    //   name:
                                    //     userPayload.firstName +
                                    //     ", " +
                                    //     userPayload.lastName,
                                    // };
                                    // // sendTemplate(
                                    // //   watch.email,
                                    // //   process.env.FROM,
                                    // //   process.env.DEPOSIT_TEMPLATE_ID,
                                    // //   dynamic_template_data
                                    // // );
                                    //  throw new Error('');
                                  } else {
                                    throw new Error("22");
                                  }
                                }
                              }
                            } else {
                              throw new Error("11");
                            }
                          });
                        }
                      } catch (error) {
                        console.log(error, "hkhjj");
                      }
                    });
                  }
                } catch (error) {
                  // Handle the error here
                  console.error("Error occurred:", error.message);
                  // console.log(watch.address, "failed addresses");

                  const checkFailed = await FailedTransaction.findOne({
                    where: { address: watch.address },
                  });

                  // console.log(checkFailed);

                  if (checkFailed == null && watch.symbol === "USD") {
                    console.log("type is null");
                    await FailedTransaction.create({
                      address: watch.address,
                    });
                  }
                }
              } else if (watch.symbol === "USDE") {
                try {
                  let result = await instance2.get(
                    "api?module=account&action=tokentx&address=" +
                      watch.address +
                      "&page=1&offset=1000"
                  );

                  let blockNumber = await web4.eth.getBlockNumber();

                  console.log(result.data.result, "JJJIII");

                  if (result.data.result.length > 0) {
                    result.data.result.forEach(async (deposit, index) => {
                      // console.log(deposit);
                      console.log(deposit);

                      await db.sequelize.transaction(async (addDeposit) => {
                        try {
                          if (
                            deposit.to.toLowerCase() ==
                            watch.address.toLowerCase()
                          ) {
                            let findDepositHash = await Deposit.findOne({
                              where: { hash: deposit.hash },
                            });
                            if (!findDepositHash) {
                              let amount =
                                parseInt(deposit.value) / 1000000000000000000;

                              let depPayload = {
                                hash: deposit.hash,
                                blockchain: watch.blockchain,
                              };
                              let enterHash = await Depoxit(
                                depPayload,
                                addDeposit
                              );

                              let upDBridge = await UpdatBridge(
                                watch.txnId,
                                addDeposit
                              );

                              let ntPayload = {
                                email: watch.email,
                                meta: {
                                  symbol: watch.symbol,
                                  amount: amount.toString(),
                                  type: "deposit",
                                },
                              };

                              let createNt = await nt(ntPayload, addDeposit);
                              const percentage = 0.01; // 0.3% expressed as a decimal

                              const deduction = amount * percentage;
                              const finalAmount = amount - deduction;

                              let txDeposit = {
                                email: watch.email,
                                to_email: watch.email,
                                meta: {
                                  symbol:
                                    watch.symbolOut === "USDE"
                                      ? "USD"
                                      : watch.symbolOut,
                                  txh: deposit.transactionHash,
                                  confirmation: "3/3",
                                  network: watch.blockchain,
                                  wallet_address: deposit.to,
                                  txnId: watch.txnId,
                                },

                                amount: amount,
                                type: "DEPOSIT",
                                status: "SUCCESS",
                              };

                              // condition ? expressionIfTrue : expressionIfFalse;

                              let txWithdrawal = {
                                email: watch.email,
                                to_email: watch.email,
                                meta: {
                                  symbol:
                                    watch.symbolOut === "USDE"
                                      ? "USD"
                                      : watch.symbolOut,
                                  network: watch.blockchainOut,
                                  fee: "1%",
                                  to_send: finalAmount,
                                  wallet_address: watch.recieving_wallet,
                                  txnId: watch.txnId,
                                },
                                amount: finalAmount,
                                type: "WIITHDRAWAL",
                                status: "PENDING",
                              };
                              let createTx = await tx(txDeposit, addDeposit);
                              let createTx2 = await tx(
                                txWithdrawal,
                                addDeposit
                              );
                              const realtime = getAblyInstance();
                              const channel =
                                realtime.channels.get("bridge-events");
                              await channel.publish(
                                `${watch.txnId}/deposit/success`,
                                createTx
                              );

                              await sendTemplateAlt({
                                subject: "Withdrawal request",
                                message: `${watch.email} made a Bridge Request, and deposited ${amount} ${watch.symbol}  on Network: ${watch.blockchain}. And is requesting withdrawal of ${finalAmount} ${watch.symbolOut} Network: ${watch.blockchainOut}`,
                              });
                              if (
                                !enterHash[0][1] &&
                                !createNt[0][1] &&
                                !createTx[0][1] &&
                                !createTx2[0][1] &&
                                !upDBridge[0][1]
                              ) {
                                console.log("______))))))000");
                                addDeposit.rollback();
                              } else {
                                let userPayload = await User.findOne({
                                  where: { email: watch.email },
                                });

                                console.log("User Does Not Exist");
                                if (userPayload) {
                                  var dynamic_template_data = {
                                    amount: amount,
                                    symbol: watch.symbol,
                                    subject: "Egax Deposit Confirmation",
                                    name:
                                      userPayload.firstName +
                                      ", " +
                                      userPayload.lastName,
                                  };
                                  // sendTemplate(
                                  //   watch.email,
                                  //   process.env.FROM,
                                  //   process.env.DEPOSIT_TEMPLATE_ID,
                                  //   dynamic_template_data
                                  // );

                                  //  throw new Error('');
                                } else {
                                  throw new Error("22");
                                }
                              }
                            }
                          } else {
                            throw new Error("11");
                          }
                        } catch (error) {
                          console.log(error);
                        }
                      });
                    });
                  } else {
                    console.log("No data ___________");
                  }
                } catch (error) {
                  // Handle the error here
                  console.error("Error occurred:", error.message);
                  // console.log(watch.address, "failed addresses");

                  const checkFailed = await FailedTransaction.findOne({
                    where: { address: watch.address },
                  });

                  // console.log(checkFailed);

                  if (checkFailed == null && watch.symbol === "USD") {
                    console.log("type is null");
                    await FailedTransaction.create({
                      address: watch.address,
                    });
                  }
                }
              } else if (watch.symbol === "ESTA") {
                try {
                  var instance = new web5.eth.Contract(abi, asset.contract);

                  const options = {
                    filter: {
                      to: watch.address,
                    },
                    fromBlock: parseInt(watch.block) + 1,
                    toBlock: parseInt(watch.block) + 3000,
                  };

                  let returned_event = [];
                  returned_event = await instance.getPastEvents(
                    "Transfer",
                    options
                  );
                  // let blockNumber = await web4.eth.getBlockNumber();

                  console.log(returned_event);

                  if (returned_event.length > 0) {
                    returned_event.forEach(async (deposit) => {
                      if (deposit.returnValues.to !== undefined) {
                        await db.sequelize.transaction(async (addDeposit) => {
                          if (
                            deposit.returnValues.to.toLowerCase() ==
                            watch.address.toLowerCase()
                          ) {
                            let findDepositHash = await Deposit.findOne({
                              where: { hash: deposit.transactionHash },
                            });
                            if (!findDepositHash) {
                              let amount =
                                parseInt(deposit.returnValues.value) /
                                1000000000000000000;

                              let depPayload = {
                                hash: deposit.transactionHash,
                                blockchain: watch.blockchain,
                              };
                              let enterHash = await Depoxit(
                                depPayload,
                                addDeposit
                              );

                              let upDBridge = await UpdatBridge(
                                watch.txnId,
                                addDeposit
                              );

                              let ntPayload = {
                                email: watch.email,
                                meta: {
                                  symbol: watch.symbol,
                                  amount: amount.toString(),
                                  type: "deposit",
                                },
                              };
                              let createNt = await nt(ntPayload, addDeposit);
                              const percentage = 0.01; // 0.3% expressed as a decimal

                              const deduction = amount * percentage;
                              const finalAmount = amount - deduction;

                              let txDeposit = {
                                email: watch.email,
                                to_email: watch.email,
                                meta: {
                                  symbol: watch.symbol,
                                  txh: deposit.transactionHash,
                                  confirmation: "3/3",
                                  network: watch.blockchain,
                                  wallet_address: deposit.returnValues.to,
                                  txnId: watch.txnId,
                                },

                                amount: amount,
                                type: "DEPOSIT",
                                status: "SUCCESS",
                              };

                              let txWithdrawal = {
                                email: watch.email,
                                to_email: watch.email,
                                meta: {
                                  symbol:
                                    watch.symbolOut === "ESTAE"
                                      ? "ESTA"
                                      : watch.symbolOut,
                                  network: watch.blockchainOut,
                                  fee: "1%",
                                  to_send: finalAmount,
                                  wallet_address: watch.recieving_wallet,
                                  txnId: watch.txnId,
                                },
                                amount: finalAmount,
                                type: "WIITHDRAWAL",
                                status: "PENDING",
                              };

                              let createTx = await tx(txDeposit, addDeposit);
                              let createTx2 = await tx(
                                txWithdrawal,
                                addDeposit
                              );
                              const realtime = getAblyInstance();
                              const channel =
                                realtime.channels.get("bridge-events");
                              await channel.publish(
                                `${watch.txnId}/deposit/success`,
                                createTx
                              );

                              await sendTemplateAlt({
                                subject: "Withdrawal request",
                                message: `${watch.email} made a Bridge Request, and deposited ${amount} ${watch.symbol}  on Network: ${watch.blockchain}. And is requesting withdrawal of ${finalAmount} ${watch.symbolOut} Network: ${watch.blockchainOut}`,
                              });

                              if (
                                // !addFund[0][1] &&
                                !enterHash[0][1] &&
                                !createNt[0][1] &&
                                !createTx[0][1] &&
                                !createTx2[0][1] &&
                                !upDBridge[0][1]
                              ) {
                                addDeposit.rollback();
                              } else {
                                let userPayload = await User.findOne({
                                  where: { email: watch.email },
                                });
                                if (userPayload) {
                                  // var dynamic_template_data = {
                                  //   amount: amount,
                                  //   symbol: symbol,
                                  //   subject: "Egoras Deposit Confirmation",
                                  //   name:
                                  //     userPayload.firstName +
                                  //     ", " +
                                  //     userPayload.lastName,
                                  // };
                                  // sendTemplate(
                                  //   email,
                                  //   process.env.FROM,
                                  //   process.env.DEPOSIT_TEMPLATE_ID,
                                  //   dynamic_template_data
                                  // );
                                  //await addDeposit.commit();
                                } else {
                                  throw new Error("");
                                }
                              }
                            }
                          } else {
                            throw new Error("");
                          }
                        });
                      }
                    });
                  }
                } catch (error) {
                  console.log(error);
                }
              } else if (watch.symbol === "ESTAE") {
                try {
                  let instance = new web4.eth.Contract(erc721, asset.contract);

                  const options = {
                    filter: {
                      to: watch.address,
                    },
                    fromBlock: parseInt(watch.block) + 1,
                    toBlock: parseInt(watch.block) + 3000,
                  };

                  let returned_event = [];
                  returned_event = await instance.getPastEvents(
                    "Transfer",
                    options
                  );
                  let blockNumber = await web4.eth.getBlockNumber();

                  // console.log(returned_event, "POOOy", blockNumber);

                  if (returned_event.length > 0) {
                    returned_event.forEach(async (deposit, index) => {
                      try {
                        if (deposit.returnValues.to !== undefined) {
                          await db.sequelize.transaction(async (addDeposit) => {
                            // console.log(deposit.returnValues.to, "jkjkjkji");
                            // console.log(watch.address, "jkjkjkji");
                            // console.log(deposit.returnValues.length);
                            if (
                              deposit.returnValues.to.toLowerCase() ==
                              watch.address.toLowerCase()
                            ) {
                              let findDepositHash = await Deposit.findOne({
                                where: { hash: deposit.transactionHash },
                              });
                              if (!findDepositHash) {
                                let amount = 0;
                                amount =
                                  parseInt(deposit.returnValues.amount) /
                                  1000000000000000000;

                                let depPayload = {
                                  hash: deposit.transactionHash,
                                  blockchain: watch.blockchain,
                                };
                                let enterHash = await Depoxit(
                                  depPayload,
                                  addDeposit
                                );

                                let upDBridge = await UpdatBridge(
                                  watch.txnId,
                                  addDeposit
                                );

                                let ntPayload = {
                                  email: watch.email,
                                  meta: {
                                    symbol: watch.symbol,
                                    amount: amount.toString(),
                                    type: "deposit",
                                  },
                                };
                                let createNt = await nt(ntPayload, addDeposit);
                                const percentage = 0.01; // 0.3% expressed as a decimal

                                const deduction = amount * percentage;
                                const finalAmount = amount - deduction;

                                let txDeposit = {
                                  email: watch.email,
                                  to_email: watch.email,
                                  meta: {
                                    symbol:
                                      watch.symbolOut === "ESTAE"
                                        ? "ESTA"
                                        : watch.symbolOut,
                                    txh: deposit.transactionHash,
                                    confirmation: "3/3",
                                    network: watch.blockchain,
                                    wallet_address: deposit.to,
                                    txnId: watch.txnId,
                                  },

                                  amount: amount,
                                  type: "DEPOSIT",
                                  status: "SUCCESS",
                                };

                                let txWithdrawal = {
                                  email: watch.email,
                                  to_email: watch.email,
                                  meta: {
                                    symbol:
                                      watch.symbolOut === "ESTAE"
                                        ? "ESTA"
                                        : watch.symbolOut,
                                    network: watch.blockchainOut,
                                    fee: "1%",
                                    to_send: finalAmount,
                                    wallet_address: watch.recieving_wallet,
                                    txnId: watch.txnId,
                                  },
                                  amount: finalAmount,
                                  type: "WIITHDRAWAL",
                                  status: "PENDING",
                                };
                                let createTx = await tx(txDeposit, addDeposit);
                                let createTx2 = await tx(
                                  txWithdrawal,
                                  addDeposit
                                );
                                const realtime = getAblyInstance();
                                const channel =
                                  realtime.channels.get("bridge-events");
                                await channel.publish(
                                  `${watch.txnId}/deposit/success`,
                                  createTx
                                );

                                await sendTemplateAlt({
                                  subject: "Withdrawal request",
                                  message: `${watch.email} made a Bridge Request, and deposited ${amount} ${watch.symbol}  on Network: ${watch.blockchain}. And is requesting withdrawal of ${finalAmount} ${watch.symbolOut} Network: ${watch.blockchainOut}`,
                                });

                                if (
                                  !enterHash[0][1] &&
                                  !createNt[0][1] &&
                                  !createTx[0][1] &&
                                  !createTx2[0][1] &&
                                  !upDBridge[0][1]
                                ) {
                                  console.log("kjoijoijoi");
                                  addDeposit.rollback();
                                } else {
                                  let userPayload = await User.findOne({
                                    where: { email: watch.email },
                                  });

                                  console.log("User Does Not Exist");
                                  if (userPayload) {
                                    // var dynamic_template_data = {
                                    //   amount: amount,
                                    //   symbol: watch.symbol,
                                    //   subject: "Egax Deposit Confirmation",
                                    //   name:
                                    //     userPayload.firstName +
                                    //     ", " +
                                    //     userPayload.lastName,
                                    // };
                                    // sendTemplate(
                                    //   watch.email,
                                    //   process.env.FROM,
                                    //   process.env.DEPOSIT_TEMPLATE_ID,
                                    //   dynamic_template_data
                                    // );
                                    //  throw new Error('');
                                  } else {
                                    throw new Error("22");
                                  }
                                }
                              }
                            } else {
                              throw new Error("11");
                            }
                          });
                        }
                      } catch (error) {
                        console.log(error, "hkhjj");
                      }
                    });
                  }
                } catch (error) {
                  console.log(error);
                }
              }
            }
          });
        }, 5000);
      });
    }
    return successResponse(req, res, {});
  } catch (error) {
    console.log(error, "ssssss");
    return errorResponse(req, res, error.message);
  }
};

// exports.watchEgochainUSDT = async (req, res) => {
//   try {
//     // Calculate the timestamp 15 minutes ago
//     const fifteenMinutesAgo = new Date(new Date() - 15 * 60 * 1000);
//     let watches = await EgoWatch.findAll({
//       where: {
//         symbol: {
//           [Op.eq]: "USD",
//         },
//         // updatedAt: {
//         //   [Op.lte]: fifteenMinutesAgo,
//         // },
//       },
//       order: [
//         ["id", "DESC"],
//         ["updatedAt", "DESC"],
//       ],
//     });
//     // console.log(watches);

//     if (watches) {
//       // console.log("BBBB");
//       watches.forEach(async (watch) => {
//         //console.log(watch.symbol);
//         let asset = await Asset.findOne({
//           where: { symbol: "USDE", blockchain: "EGOCHAIN" },
//         });
//         // console.log(asset, "kkkLLL");
//         if (asset) {
//           console.log("KKOOKK");

//           var instance = new web4.eth.Contract(abi, asset.contract);

//           const options = {
//             filter: {
//               to: watch.address,
//             },
//             fromBlock: parseInt(watch.block) + 1,
//             toBlock: parseInt(watch.block) + 3000,
//           };

//           let returned_event = [];
//           returned_event = await instance.getPastEvents("Transfer", options);
//           // let blockNumber = await web4.eth.getBlockNumber();

//           // block = result.data.data.block;
//           console.log(returned_event);
//           if (returned_event.length > 0) {
//             returned_event.forEach(async (deposit) => {
//               console.log(deposit.confirmations);
//               console.log(deposit.to);

//               await db.sequelize.transaction(async (addDeposit) => {
//                 if (
//                   deposit.returnValues.to.toLowerCase() ==
//                   watch.address.toLowerCase()
//                 ) {
//                   let findDepositHash = await Deposit.findOne({
//                     where: { hash: deposit.transactionHash },
//                   });
//                   if (!findDepositHash) {
//                     let amount =
//                       parseInt(deposit.returnValues.value) /
//                       1000000000000000000;
//                     let addFund = await add(
//                       watch.email,
//                       watch.symbol,
//                       "portfolio",
//                       "value",
//                       amount,
//                       addDeposit
//                     );
//                     const enterHash = await Deposit.create(
//                       {
//                         hash: deposit.transactionHash,
//                         blockchain: "EGOCHAIN",
//                       },
//                       { transaction: addDeposit }
//                     );

//                     let ntPayload = {
//                       email: watch.email,
//                       meta: {
//                         symbol: watch.symbol,
//                         amount: amount.toString(),
//                         type: "deposit",
//                       },
//                     };
//                     let createNt = await nt(ntPayload, addDeposit);

//                     let txPayload = {
//                       email: watch.email,
//                       to_email: watch.email,
//                       meta: {
//                         symbol: watch.symbol,
//                         txh: deposit.transactionHash,
//                         confirmation: "3/3",
//                         network: "EGOCHAIN",
//                         wallet_address: deposit.to,
//                       },

//                       amount: amount,
//                       type: "DEPOSIT",
//                       status: "SUCCESS",
//                     };
//                     let createTx = await tx(txPayload, addDeposit);
//                     let updateWatch = await EgoWatch.update(
//                       { block: deposit.blockNumber },
//                       { where: { symbol: watch.symbol, email: watch.email } }
//                     );
//                     if (
//                       !addFund[0][1] &&
//                       !enterHash &&
//                       !createNt[0][1] &&
//                       !createTx[0][1] &&
//                       !updateWatch[0][1]
//                     ) {
//                       addDeposit.rollback();
//                     } else {
//                       let userPayload = await User.findOne({
//                         where: { email: watch.email },
//                       });

//                       console.log("User Does Not Exist");
//                       if (userPayload) {
//                         var dynamic_template_data = {
//                           amount: amount,
//                           symbol: watch.symbol,
//                           subject: "Egax Deposit Confirmation",
//                           name:
//                             userPayload.firstName + ", " + userPayload.lastName,
//                         };
//                         sendTemplate(
//                           watch.email,
//                           process.env.FROM,
//                           process.env.DEPOSIT_TEMPLATE_ID,
//                           dynamic_template_data
//                         );

//                         //  throw new Error('');
//                       } else {
//                         throw new Error("22");
//                       }
//                     }
//                   }
//                 } else {
//                   throw new Error("11");
//                 }
//               });
//             });
//           } else {
//             if (parseInt(block) + 4899 > returned_event.currentBlock) {
//               await Watch.update(
//                 { block: returned_event.currentBlock },
//                 { where: { symbol, email: email } }
//               );
//             } else {
//               await Watch.update(
//                 { block: parseInt(block) + 4899 },
//                 { where: { symbol, email: email } }
//               );
//             }
//           }
//         }
//       });
//     }
//     return successResponse(req, res, {});
//   } catch (error) {
//     console.log(error);
//     return errorResponse(req, res, error.message);
//   }
// };

exports.getTransactionHistory = async (req, res) => {
  try {
    console.log("llls");
    const { contract, address, block } = req.body;
    console.log(req.body);
    var instance = new web3.eth.Contract(abi, contract);

    const options = {
      filter: {
        to: address,
      },
      fromBlock: parseInt(block) + 1,
      toBlock: parseInt(block) + 3000,
    };
    let returned_event = [];
    returned_event = await instance.getPastEvents("Transfer", options);
    let blockNumber = await web3.eth.getBlockNumber();

    // console.log(returned_event);
    return successResponse(req, res, {
      events: returned_event,
      currentBlock: blockNumber,
    });
  } catch (error) {
    console.log(error, "houjo");
    return errorResponse(req, res, error.message);
  }
};

// exports.getTransactionHistory = async (req, res) => {
//   try {
//     let watch = await EgoWatch.findAll();

//     return successResponse(req, res, {});
//   } catch (error) {
//     console.log(error);
//     return errorResponse(req, res, error.message);
//   }
// };

exports.fetchOrGenerateNewWallet = async ({ email, symbol }) => {
  try {
    let asset = await Asset.findOne({ where: { symbol } });

    if (!asset) {
      throw new Error("Account not listed");
    }

    let wallet;
    let egoBlock = 0;

    if (asset.blockchain === "EGOCHAIN") {
      console.log("sss");
      wallet = await Wallet.findOne({
        where: { blockchain: "BINANCE", email: email },
      });
      let res = await instance2.get("api?module=block&action=eth_block_number");

      console.log(res.data.result);

      egoBlock = web4.utils.hexToNumber(res.data.result);

      console.log(egoBlock);
    } else {
      console.log("kkk");
      wallet = await Wallet.findOne({
        where: { blockchain: "BINANCE", email: email },
      });
    }

    console.log(asset.blockchain, "klk");

    let address;
    let result;
    let block = 0;
    if (!wallet) {
      // generate wallet
      switch (asset.blockchain) {
        case "ETHEREUM":
          result = await instance.get("ethereum/create/wallet");
          block = result.data.data.block;
          break;
        case "BINANCE":
        case "EGOCHAIN":
          console.log("lklhh");
          let dataw = {};
          let lblock = await web3.eth.getBlockNumber();
          const ethers = require("ethers");
          // Wrap the createRandom() call in a Promise with a timeout
          const createRandomPromise = new Promise((resolve, reject) => {
            setTimeout(() => {
              reject(new Error("createRandom() call timed out"));
            }, 10000); // 15 seconds timeout

            const wallet = ethers.Wallet.createRandom();
            resolve(wallet);
          });

          try {
            const wallet = await Promise.race([createRandomPromise]);
            // console.log(wallet, "vjbj");

            dataw = {
              data: {
                data: {
                  key: wallet.privateKey,
                  mnemonic: wallet.mnemonic.phrase,
                  address: wallet.address,
                },
              },
            };

            // console.log(lblock, dataw);

            result = dataw;
            block = lblock;
          } catch (error) {
            console.error("Error creating random wallet:", error);
            // Handle error accordingly
            return {
              error: error.message,
            };
            // return errorResponse(req, res, error.message);
          }
          // console.log(dataw, jjijj);
          break;

        case "BITCOIN":
          result = await instance.get("bitcoin/create/wallet");
          break;

        default:
          throw new Error("Blockchain not found");
      }
      console.log(asset.blockchain);
      if (asset.blockchain == "EGOCHAIN") {
        console.log("ddd");
        await Wallet.create({
          blockchain: "BINANCE",
          address: result.data.data.address,
          meta: result.data.data,
          email: email,
        });
      } else {
        console.log("vvv");
        await Wallet.create({
          blockchain: asset.blockchain,
          address: result.data.data.address,
          meta: result.data.data,
          email: email,
        });
      }

      // console.log(result.data.data);
      address = result.data.data.address;
    } else {
      let watch = await Watch.findOne({
        where: { address: wallet.address, email: email },
        order: [["createdAt", "DESC"]],
      });

      if (watch) {
        block = watch.block;
      } else {
        block = JSON.parse(wallet.meta).block;
      }

      address = wallet.address;
    }

    if (address != "") {
      if (asset.blockchain === "EGOCHAIN") {
        if (symbol === "USDE") {
          let watch = await EgoWatch.findOne({
            where: { symbol: "USD", email: email },
          });
          if (watch) {
            await EgoWatch.update(
              { symbol, email: email },
              { where: { symbol, email: email } }
            );
          } else {
            await EgoWatch.create({
              symbol: "USD",
              email: email,
              block: egoBlock,
              address,
            });
          }
        } else if (symbol === "ESTAE") {
          let watch = await EgoWatch.findOne({
            where: { symbol: "ESTA", email: email },
          });
          if (watch) {
            await EgoWatch.update(
              { symbol, email: email },
              { where: { symbol, email: email } }
            );
          } else {
            await EgoWatch.create({
              symbol: "ESTA",
              email: email,
              block: egoBlock,
              address,
            });
          }
        } else {
          let watch = await EgoWatch.findOne({
            where: { symbol, email: email },
          });
          if (watch) {
            await EgoWatch.update(
              { symbol, email: email },
              { where: { symbol, email: email } }
            );
          } else {
            await EgoWatch.create({
              symbol,
              email: email,
              block: egoBlock,
              address,
            });
          }
        }
      } else {
        let watch = await Watch.findOne({
          where: { symbol, email: email },
        });
        if (watch) {
          await Watch.update(
            { symbol, email: email },
            { where: { symbol, email: email } }
          );
        } else {
          await Watch.create({
            symbol,
            email: email,
            block: block,
            address,
          });
        }
      }
    }

    let finalSymbol = "";

    if (symbol === "USDE") {
      finalSymbol = "USD";
    } else if (symbol === "ESTAE") {
      finalSymbol = "ESTA";
    } else {
      finalSymbol = symbol;
    }

    let message = "";
    if (asset.blockchain == "ETHEREUM") {
      message =
        "Send only " +
        symbol +
        " to this deposit address. \nEnsure the network is Ethereum (ERC20). \nDo not send NFTs to this address.";
    } else if (asset.blockchain == "BINANCE") {
      message =
        "Send only " +
        symbol +
        " to this deposit address. \nEnsure the network is BNB Smart Chain (BEP20). \nDo not send NFTs to this address";
    } else if (asset.blockchain == "BITCOIN") {
      message =
        "Send only " +
        symbol +
        " to this deposit address. \nEnsure the network is Bitcoin. \nDo not send NFTs to this address";
    } else if (asset.blockchain == "EGOCHAIN") {
      if (finalSymbol === "ESTA") {
        message =
          "Send only " +
          finalSymbol +
          " to this deposit address. \nEnsure the network is Egochain.";
      } else {
        message =
          "Send only " +
          finalSymbol +
          " to this deposit address. \nEnsure the network is Egochain. \nDo not send NFTs to this address";
      }
    }

    return { address, message };
  } catch (error) {
    console.log(error.message, "uuj");
    return {
      error: error.message,
    };
  }
};
exports.get = async (req, res) => {
  try {
    const { symbol } = req.body;

    let asset = await Asset.findOne({ where: { symbol } });

    if (!asset) {
      throw new Error("Account not listed");
    }

    let wallet;
    let egoBlock = 0;

    if (asset.blockchain === "EGOCHAIN") {
      console.log("sss");
      wallet = await Wallet.findOne({
        where: { blockchain: "BINANCE", email: req.user.email },
      });
      let res = await instance2.get("api?module=block&action=eth_block_number");

      console.log(res.data.result);

      egoBlock = web4.utils.hexToNumber(res.data.result);

      console.log(egoBlock);
    } else {
      console.log("kkk");
      wallet = await Wallet.findOne({
        where: { blockchain: "BINANCE", email: req.user.email },
      });
    }

    console.log(asset.blockchain, "klk");

    let address;
    let result;
    let block = 0;
    if (!wallet) {
      // generate wallet
      switch (asset.blockchain) {
        case "ETHEREUM":
          result = await instance.get("ethereum/create/wallet");
          block = result.data.data.block;
          break;
        case "BINANCE":
        case "EGOCHAIN":
          console.log("lklhh");
          let dataw = {};
          let lblock = await web3.eth.getBlockNumber();
          const ethers = require("ethers");
          // Wrap the createRandom() call in a Promise with a timeout
          const createRandomPromise = new Promise((resolve, reject) => {
            setTimeout(() => {
              reject(new Error("createRandom() call timed out"));
            }, 10000); // 15 seconds timeout

            const wallet = ethers.Wallet.createRandom();
            resolve(wallet);
          });

          try {
            const wallet = await Promise.race([createRandomPromise]);
            // console.log(wallet, "vjbj");

            dataw = {
              data: {
                data: {
                  key: wallet.privateKey,
                  mnemonic: wallet.mnemonic.phrase,
                  address: wallet.address,
                },
              },
            };

            // console.log(lblock, dataw);

            result = dataw;
            block = lblock;
          } catch (error) {
            console.error("Error creating random wallet:", error);
            // Handle error accordingly
            return errorResponse(req, res, error.message);
          }
          // console.log(dataw, jjijj);
          break;

        case "BITCOIN":
          result = await instance.get("bitcoin/create/wallet");
          break;

        default:
          throw new Error("Blockchain not found");
      }
      console.log(asset.blockchain);
      if (asset.blockchain == "EGOCHAIN") {
        console.log("ddd");
        await Wallet.create({
          blockchain: "BINANCE",
          address: result.data.data.address,
          meta: result.data.data,
          email: req.user.email,
        });
      } else {
        console.log("vvv");
        await Wallet.create({
          blockchain: asset.blockchain,
          address: result.data.data.address,
          meta: result.data.data,
          email: req.user.email,
        });
      }

      // console.log(result.data.data);
      address = result.data.data.address;
    } else {
      let watch = await Watch.findOne({
        where: { address: wallet.address, email: req.user.email },
        order: [["createdAt", "DESC"]],
      });

      if (watch) {
        block = watch.block;
      } else {
        block = JSON.parse(wallet.meta).block;
      }

      address = wallet.address;
    }

    if (address != "") {
      if (asset.blockchain === "EGOCHAIN") {
        if (symbol === "USDE") {
          let watch = await EgoWatch.findOne({
            where: { symbol: "USD", email: req.user.email },
          });
          if (watch) {
            await EgoWatch.update(
              { symbol, email: req.user.email },
              { where: { symbol, email: req.user.email } }
            );
          } else {
            await EgoWatch.create({
              symbol: "USD",
              email: req.user.email,
              block: egoBlock,
              address,
            });
          }
        } else if (symbol === "ESTAE") {
          let watch = await EgoWatch.findOne({
            where: { symbol: "ESTA", email: req.user.email },
          });
          if (watch) {
            await EgoWatch.update(
              { symbol, email: req.user.email },
              { where: { symbol, email: req.user.email } }
            );
          } else {
            await EgoWatch.create({
              symbol: "ESTA",
              email: req.user.email,
              block: egoBlock,
              address,
            });
          }
        } else {
          let watch = await EgoWatch.findOne({
            where: { symbol, email: req.user.email },
          });
          if (watch) {
            await EgoWatch.update(
              { symbol, email: req.user.email },
              { where: { symbol, email: req.user.email } }
            );
          } else {
            await EgoWatch.create({
              symbol,
              email: req.user.email,
              block: egoBlock,
              address,
            });
          }
        }
      } else {
        let watch = await Watch.findOne({
          where: { symbol, email: req.user.email },
        });
        if (watch) {
          await Watch.update(
            { symbol, email: req.user.email },
            { where: { symbol, email: req.user.email } }
          );
        } else {
          await Watch.create({
            symbol,
            email: req.user.email,
            block: block,
            address,
          });
        }
      }
    }

    let finalSymbol = "";

    if (symbol === "USDE") {
      finalSymbol = "USD";
    } else if (symbol === "ESTAE") {
      finalSymbol = "ESTA";
    } else {
      finalSymbol = symbol;
    }

    let message = "";
    if (asset.blockchain == "ETHEREUM") {
      message =
        "Send only " +
        symbol +
        " to this deposit address. \nEnsure the network is Ethereum (ERC20). \nDo not send NFTs to this address.";
    } else if (asset.blockchain == "BINANCE") {
      message =
        "Send only " +
        symbol +
        " to this deposit address. \nEnsure the network is BNB Smart Chain (BEP20). \nDo not send NFTs to this address";
    } else if (asset.blockchain == "BITCOIN") {
      message =
        "Send only " +
        symbol +
        " to this deposit address. \nEnsure the network is Bitcoin. \nDo not send NFTs to this address";
    } else if (asset.blockchain == "EGOCHAIN") {
      if (finalSymbol === "ESTA") {
        message =
          "Send only " +
          finalSymbol +
          " to this deposit address. \nEnsure the network is Egochain.";
      } else {
        message =
          "Send only " +
          finalSymbol +
          " to this deposit address. \nEnsure the network is Egochain. \nDo not send NFTs to this address";
      }
    }

    return successResponse(req, res, { address, message });
  } catch (error) {
    console.log(error.message, "uuj");
    return errorResponse(req, res, error.message);
  }
};

// exports.get = async (req, res) => {
//   try {
//     const { symbol } = req.body;

//     let asset = await Asset.findOne({ where: { symbol } });

//     if (!asset) {
//       throw new Error("Account not listed");
//     }

//     let wallet = await Wallet.findOne({
//       where: { blockchain: asset.blockchain, email: req.user.email },
//     });
//     let address;
//     let result;
//     let block = 0;
//     if (!wallet) {
//       // generate wallet
//       switch (asset.blockchain) {
//         case "ETHEREUM":
//           result = await instance.get("ethereum/create/wallet");
//           block = result.data.data.block;
//           break;
//         case "BINANCE":
//           result = await instance.get("binance/create/wallet");
//           block = result.data.data.block;
//           break;
//         case "BITCOIN":
//           result = await instance.get("bitcoin/create/wallet");
//           break;

//         default:
//           throw new Error("Blockchain not found");
//       }
//       await Wallet.create({
//         blockchain: asset.blockchain,
//         address: result.data.data.address,
//         meta: result.data.data,
//         email: req.user.email,
//       });

//       // console.log(result.data.data);
//       address = result.data.data.address;
//     } else {
//       let watch = await Watch.findOne({
//         where: { address: wallet.address, email: req.user.email },
//         order: [["createdAt", "DESC"]],
//       });

//       if (watch) {
//         block = watch.block;
//       } else {
//         block = JSON.parse(wallet.meta).block;
//       }

//       address = wallet.address;
//     }

//     if (address != "") {
//       let watch = await Watch.findOne({
//         where: { symbol, email: req.user.email },
//       });
//       if (watch) {
//         await Watch.update(
//           { symbol, email: req.user.email },
//           { where: { symbol, email: req.user.email } }
//         );
//       } else {
//         await Watch.create({
//           symbol,
//           email: req.user.email,
//           block: block,
//           address,
//         });
//       }
//     }

//     let message = "";
//     if (asset.blockchain == "ETHEREUM") {
//       message =
//         "Send only " +
//         symbol +
//         " to this deposit address. \nEnsure the network is Ethereum (ERC20). \nDo not send NFTs to this address.";
//     } else if (asset.blockchain == "BINANCE") {
//       message =
//         "Send only " +
//         symbol +
//         " to this deposit address. \nEnsure the network is BNB Smart Chain (BEP20). \nDo not send NFTs to this address";
//     } else if (asset.blockchain == "BITCOIN") {
//       message =
//         "Send only " +
//         symbol +
//         " to this deposit address. \nEnsure the network is Bitcoin. \nDo not send NFTs to this address";
//     }

//     return successResponse(req, res, { address, message });
//   } catch (error) {
//     console.log(error);
//     return errorResponse(req, res, error.message);
//   }
// };

// exports.get2 = async (req, res) => {
//   try {
//     const { symbol } = req.body;

//     let asset = await Asset.findOne({ where: { symbol } });

//     if (!asset) {
//       throw new Error("Account not listed");
//     }

//     let wallet = await Wallet.findOne({
//       where: { blockchain: asset.blockchain, email: req.user.email },
//     });
//     let address;
//     let result;
//     let block = 0;
//     if (!wallet) {
//       // generate wallet
//       switch (asset.blockchain) {
//         case "ETHEREUM":
//           result = await instance.get("ethereum/create/wallet");
//           block = result.data.data.block;
//           break;
//         case "BINANCE":
//           result = await instance.get("binance/create/wallet");
//           block = result.data.data.block;
//           break;
//         case "BITCOIN":
//           result = await instance.get("bitcoin/create/wallet");
//           break;

//         default:
//           throw new Error("Blockchain not found");
//       }
//       await Wallet.create({
//         blockchain: asset.blockchain,
//         address: result.data.data.address,
//         meta: result.data.data,
//         email: req.user.email,
//       });

//       // console.log(result.data.data);
//       address = result.data.data.address;
//     } else {
//       let watch = await Watch.findOne({
//         where: { address: wallet.address, email: req.user.email },
//         order: [["createdAt", "DESC"]],
//       });

//       if (watch) {
//         block = watch.block;
//       } else {
//         block = JSON.parse(wallet.meta).block;
//       }

//       address = wallet.address;
//     }

//     if (address != "") {
//       let watch = await Watch.findOne({
//         where: { symbol, email: req.user.email },
//       });
//       if (watch) {
//         await Watch.update(
//           { symbol, email: req.user.email },
//           { where: { symbol, email: req.user.email } }
//         );
//       } else {
//         await Watch.create({
//           symbol,
//           email: req.user.email,
//           block: block,
//           address,
//         });
//       }
//     }

//     let message = "";
//     if (asset.blockchain == "ETHEREUM") {
//       message =
//         "Send only " +
//         symbol +
//         " to this deposit address. \nEnsure the network is Ethereum (ERC20). \nDo not send NFTs to this address.";
//     } else if (asset.blockchain == "BINANCE") {
//       message =
//         "Send only " +
//         symbol +
//         " to this deposit address. \nEnsure the network is BNB Smart Chain (BEP20). \nDo not send NFTs to this address";
//     } else if (asset.blockchain == "BITCOIN") {
//       message =
//         "Send only " +
//         symbol +
//         " to this deposit address. \nEnsure the network is Bitcoin. \nDo not send NFTs to this address";
//     }

//     return successResponse(req, res, { address, message });
//   } catch (error) {
//     return errorResponse(req, res, error.message);
//   }
// };
