const {
  errorResponse,
  successResponse,
  checkBalance,
  tx,
  nt,
  add,
  Depoxit,
  UpdatBridge,
  deduct,
  uniqueId,
} = require("../../helpers");
const db = require("../../config/sequelize");
const { Op } = require("sequelize");


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

// const axios = require("axios").default;
const {
  Wallet,
  Watch,
  Deposit,
  Asset,
  User,
  // Coingecko,
  PriceOracle,
  LiquidityPoolBalance,
  Portfolio,
} = require("../../models/index");
require("dotenv").config();
const Web3 = require("web3");
var egochain_provider = "https://mainnet.egochain.org";
const ngnc = require("./build/NGNC_v1_00.json");

const contact_address = "0x15c8cF6432A4D4bB407a33b12CC9Be2075715c65";
const web3 = new Web3(egochain_provider);

// Contract.setProvider(process.env.WEB3_PROVIDER);
// const contract = new web3.eth.Contract(ngnc, contact_address);
const instance2 = axios.create({
  baseURL: "https://egoscan.io/",
  timeout: 15000,

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

exports.fetchNewTokenDeposit = async (req, res) => {
  try {
    console.log("llls");
    const { contract, address, block } = req.body;
    console.log(req.body);
    var instance = new web3.eth.Contract(ngnc, contract);

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
    return successResponse(req, res, {
      events: returned_event,
      currentBlock: blockNumber,
    });
  } catch (error) {
    console.log(error, "houjo");
    return errorResponse(req, res, error.message);
  }
};

exports.watch = async (req, res) => {
  try {
    const fifteenMinutesAgo = new Date(new Date() - 15 * 60 * 1000);

    let watches = await Watch.findAll({
      // where: {
      //   symbol: {
      //     [Op.notIn]: ["BTC", "EGC", "EGAX", "USDT"],
      //   },
      //   // updatedAt: {
      //   //   [Op.lte]: fifteenMinutesAgo,
      //   // },
      // },
      order: [
        ["id", "DESC"],
        ["updatedAt", "DESC"],
      ],
    });

    // console.log("MMM");
    let mainWatches = [];

    if (watches) {
      const promises = watches.map(async (watch) => {
        let asset = await Asset.findOne({ where: { symbol: watch.symbol } });

        // console.log(asset, "ddd");

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
          } else {
            // await binanceToken(
            //   watch.address,
            //   watch.email,
            //   watch.symbol,
            //   watch.block,
            //   watch.blockchain,
            //   watch.contract
            // );

            // console.log(watch);

            // var instance = new web3.eth.Contract(ngnc, watch.contract);

            // const options = {
            //   filter: {
            //     to: watch.address,
            //   },
            //   fromBlock: parseInt(watch.block) + 1,
            //   toBlock: parseInt(watch.block) + 3000,
            // };
            // let returned_event = [];
            // returned_event = await instance.getPastEvents("Transfer", options);
            let returned_event = await instance2.get(
              "api?module=account&action=tokentx&address=" +
                watch.address +
                "&page=1&offset=1000"
            );
            let blockNumber = await web3.eth.getBlockNumber();

            // console.log(returned_event.data.result, "KXXXD");

            if (returned_event.data.result.length > 0) {
              returned_event.data.result.forEach(async (deposit) => {
                if (deposit.tokenSymbol === "NGNct") {
                  console.log("KKKOOLL");
                  await db.sequelize.transaction(async (addDeposit) => {
                    if (
                      deposit.to.toLowerCase() == watch.address.toLowerCase()
                    ) {
                      let findDepositHash = await Deposit.findOne({
                        where: { hash: deposit.hash },
                      });
                      if (!findDepositHash) {
                        let amount =
                          parseInt(deposit.value) / 1000000000000000000;
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
                            blockchain: watch.blockchain,
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
                        // let createNt = await nt(ntPayload, addDeposit);

                        let txPayload = {
                          email: watch.email,
                          to_email: watch.email,
                          meta: {
                            symbol: watch.symbol,
                            txh: deposit.hash,
                            confirmation: "3/3",
                            network: "BNB Smart Chain (BEP20)",
                            wallet_address: deposit.to,
                          },

                          amount: amount,
                          type: "DEPOSIT",
                          status: "SUCCESS",
                        };
                        let createTx = await tx(txPayload, addDeposit);
                        let updateWatch = await Watch.update(
                          { block: deposit.blockNumber },
                          {
                            where: { symbol: watch.symbol, email: watch.email },
                          }
                        );
                        if (
                          !addFund[0][1] &&
                          !enterHash &&
                          // !createNt[0][1] &&
                          !createTx[0][1] &&
                          !updateWatch[0][1]
                        ) {
                          addDeposit.rollback();
                        } else {
                          // let userPayload = await User.findOne({
                          //   where: { email: watch.email },
                          // });
                          // if (userPayload) {
                          //   var dynamic_template_data = {
                          //     amount: amount,
                          //     symbol: symbol,
                          //     subject: "Egoras Deposit Confirmation",
                          //     name:
                          //       userPayload.firstName +
                          //       ", " +
                          //       userPayload.lastName,
                          //   };
                          //   sendTemplate(
                          //     email,
                          //     process.env.FROM,
                          //     process.env.DEPOSIT_TEMPLATE_ID,
                          //     dynamic_template_data
                          //   );
                          //   //  throw new Error('');
                          // } else {
                          //   throw new Error("mmm");
                          // }
                        }
                      }
                    } else {
                      throw new Error("kkkkj");
                    }
                  });
                }
              });
            } else {
              if (parseInt(watch.block) + 4899 > blockNumber) {
                await Watch.update(
                  { block: blockNumber },
                  { where: { symbol: watch.symbol, email: watch.email } }
                );
              } else {
                await Watch.update(
                  { block: parseInt(watch.block) + 4899 },
                  { where: { symbol: watch.symbol, email: watch.email } }
                );
              }

              //update block
            }
          }
        });
      }, 5000);
    });

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
                console.log(deposit.to.toLowerCase());
                console.log(deposit.to.toLowerCase());
                if (watch.address.toLowerCase() == watch.address.toLowerCase()) {
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
                      // if (userPayload) {
                      //   var dynamic_template_data = {
                      //     amount: amount,
                      //     symbol: watch.symbol,
                      //     subject: "Egax Deposit Confirmation",
                      //     name:
                      //       userPayload.firstName + ", " + userPayload.lastName,
                      //   };
                      //   sendTemplate(
                      //     watch.email,
                      //     process.env.FROM,
                      //     process.env.DEPOSIT_TEMPLATE_ID,
                      //     dynamic_template_data
                      //   );

                      //   //  throw new Error('');
                      // } else {
                      //   throw new Error("");
                      // }
                    }
                  }
                } else {
                  console.log("Wallet does not match or exist");
                  // throw new Error("");
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

      egoBlock = web3.utils.hexToNumber(res.data.result);

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
        case "EGOCHAIN":
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

            address = wallet.address;

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
        await Portfolio.create(
          {
            symbol: symbol,
            email: email,
            value: 0.0,
            in_trade: 0.0,
            type: "CRYPTO",
          },
          // { transaction: t }
        );
      } else {
        console.log("vvv");
        await Wallet.create({
          blockchain: asset.blockchain,
          address: result.data.data.address,
          meta: result.data.data,
          email: email,
        });
        await Portfolio.create(
          {
            symbol: symbol,
            email: email,
            value: 0.0,
            in_trade: 0.0,
            type: "CRYPTO",
          },
          // { transaction: t }
        );
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
    console.log(address, "llj");
    if (address != "") {
      if (symbol === "NGNC") {
        let watch = await Watch.findOne({
          where: { symbol: "NGNC", email: email },
        });

        if (watch) {
          await Watch.update(
            { symbol, email: email },
            { where: { symbol, email: email } }
          );
        } else {
          await Watch.create({
            symbol: "NGNC",
            email: email,
            block: egoBlock,
            address,
          });
        }
      }
    }

    let finalSymbol = symbol;

    let message = "";
    if (asset.blockchain == "EGOCHAIN") {
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

    console.log(address, "aapp");

    return { address, message };
  } catch (error) {
    console.log(error.message, "uuj");
    return {
      error: error.message,
    };
  }
};

exports.testing = async (req, res) => {
  try {
    const Contract = require("web3-eth-contract");

    const contract = new Contract(ngnc, contact_address);

    const owner = contract.method.getOwner().send();
    successResponse(req, res, { owner });
  } catch (error) {
    errorResponse(req, res, error.response || error.message);
  }
};

exports.get = async (req, res) => {
  try {
    const { symbol } = req.body;

    if (symbol === "USDE") {
      throw new Error("The EGO20 USDT deposit feature is currently undergoing maintainance, \n please check back later.");
    }

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

      egoBlock = web3.utils.hexToNumber(res.data.result);

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
          meta: encryptData(JSON.stringify(result.data.data)),
          email: req.user.email,
        });
      } else {
        console.log("vvv");
        await Wallet.create({
          blockchain: asset.blockchain,
          address: result.data.data.address,
          meta: encryptData(JSON.stringify(result.data.data)),
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
        let newBlock = await web3.eth.getBlockNumber();
        if (JSON.parse(wallet.meta).block == null) {
          block = newBlock;
        } else {
          block = JSON.parse(wallet.meta).block;
        }
      }

      address = wallet.address;
    }

    if (address != "") {
      if (asset.blockchain === "EGOCHAIN") {
        if (symbol === "USDE") {
          let watch = await Watch.findOne({
            where: { symbol: "USD", email: req.user.email },
          });
          if (watch) {
            await Watch.update(
              { symbol, email: req.user.email },
              { where: { symbol, email: req.user.email } }
            );
          } else {
            await Watch.create({
              symbol: "USD",
              email: req.user.email,
              block: egoBlock,
              address,
            });
          }
        } else if (symbol === "ESTAE") {
          let watch = await Watch.findOne({
            where: { symbol: "ESTA", email: req.user.email },
          });
          if (watch) {
            await Watch.update(
              { symbol, email: req.user.email },
              { where: { symbol, email: req.user.email } }
            );
          } else {
            await Watch.create({
              symbol: "ESTA",
              email: req.user.email,
              block: egoBlock,
              address,
            });
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
    console.log(error, "uuj");
    return errorResponse(req, res, error.message);
  }
};

exports.getTickers = async (req, res) => {
  try {
    const query = `call sp_getNewThickers()`;
    const listThickers = await db.sequelize.query(query);

    return successResponse(req, res, { listThickers });
  } catch (error) {
    console.log(error);
    return errorResponse(req, res, error.message);
  }
};

cron.schedule(
  "* * * * *",
  async (req, res) => {
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
      // return successResponse(req, res, {});
      return;
    } catch (error) {
      console.log(error);
      return errorResponse(req, res, error.message, 500, error);
    }
  },
  {
    scheduled: true,
  }
);

exports.mint = async ({ amount, address }) => {};
exports.burn = async ({ amount, address }) => {};
