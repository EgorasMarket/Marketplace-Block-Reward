const Web3 = require("web3");
const axios = require("axios");
const { Asset, Wallet, Watch, Deposit, User, Pending } = require("../models");
const { Op } = require("sequelize");
const abi = require("erc-20-abi");
const db = require("../config/sequelize");
var { sendTemplate } = require("../helpers/utils");
const {
  successResponse,
  errorResponse,
  checkBalance,
  tx,
  nt,
  add,
  deduct,
  uniqueId,
} = require("../helpers");

var provider2 = "https://eth.drpc.org";
var web4 = new Web3(provider2);
var provider3 = "https://bsc.meowrpc.com";
var web5 = new Web3(provider3);

module.exports.ubtc = async (address, email, symbol, block, blockchain) => {
  //let addDeposit;
  try {
    // addDeposit = await db.sequelize.transaction();
    let data = {
      address: address,
      block: block,
    };

    let urlResponse = await axios.post(
      process.env.BLOCKCHAIN_ENDPOINT + "bitcoin/get/transactions",
      data
    );

    if (urlResponse.data.data.unconfirmed_txrefs.length > 0) {
      // console.log(urlResponse.data.data.status);
      urlResponse.data.data.unconfirmed_txrefs.forEach(async (deposit) => {
        if (
          urlResponse.data.data.address.toLowerCase() == address.toLowerCase()
        ) {
          let findDepositHash = await Pending.findOne({
            where: { hash: deposit.tx_hash },
          });
          if (!findDepositHash) {
            await db.sequelize.transaction(async (addDeposit) => {
              let amount = parseInt(deposit.value) / 100000000;
              //  let addFund = await add(email, symbol, "portfolio", "value", amount, addDeposit);
              const enterHash = await Pending.create(
                {
                  hash: deposit.tx_hash,
                  meta: deposit,
                  blockchain: blockchain,
                },
                { transaction: addDeposit }
              );

              if (!enterHash) {
                throw new Error("Failed");
              } else {
                let userPayload = await User.findOne({
                  where: { email: email },
                });
                if (userPayload) {
                  var dynamic_template_data = {
                    amount: amount,
                    symbol: symbol,
                    subject: "Egoras Pending Deposit",
                    name: userPayload.firstName + ", " + userPayload.lastName,
                    hash: deposit.tx_hash,
                  };
                  sendTemplate(
                    email,
                    process.env.FROM,
                    process.env.PENDING_DEPOSIT_TEMPLATE_ID,
                    dynamic_template_data
                  );
                } else {
                  throw new Error("Failed");
                }
              }
            });
          }
        }
      });
    }
  } catch (error) {}
};

module.exports.btc = async (address, email, symbol, block, blockchain) => {
  //let addDeposit;
  try {
    // addDeposit = await db.sequelize.transaction();
    let data = {
      address: address,
      block: block,
    };

    let urlResponse = await axios.post(
      process.env.BLOCKCHAIN_ENDPOINT + "bitcoin/get/transactions",
      data
    );

    if (urlResponse.data.data.txrefs.length > 0) {
      // console.log(urlResponse.data.data.status);
      urlResponse.data.data.txrefs.forEach(async (deposit) => {
        if (
          urlResponse.data.data.address.toLowerCase() == address.toLowerCase()
        ) {
          let findDepositHash = await Deposit.findOne({
            where: { hash: deposit.tx_hash },
          });
          if (!findDepositHash) {
            await db.sequelize.transaction(async (addDeposit) => {
              let amount = parseInt(deposit.value) / 100000000;
              let addFund = await add(
                email,
                symbol,
                "portfolio",
                "value",
                amount,
                addDeposit
              );
              const enterHash = await Deposit.create(
                {
                  hash: deposit.tx_hash,
                  blockchain: blockchain,
                },
                { transaction: addDeposit }
              );
              let ntPayload = {
                email: email,
                meta: {
                  symbol,
                  amount: amount.toString(),
                  type: "deposit",
                },
              };

              let createNt = await nt(ntPayload, addDeposit);

              let txPayload = {
                email: email,
                to_email: email,
                meta: {
                  symbol,
                  txh: deposit.tx_hash,
                  confirmation: deposit.confirmations.toString() + "/3",
                  network: "Ethereum (ERC20)",
                  wallet_address: urlResponse.data.data.address,
                },

                amount: amount,
                type: "DEPOSIT",
                status: "SUCCESS",
              };

              let createTx = await tx(txPayload, addDeposit);
              let updateWatch = await Watch.update(
                { block: deposit.block_height },
                { where: { symbol, email: email } }
              );

              if (
                !addFund[0][1] &&
                !enterHash &&
                !createNt[0][1] &&
                !createTx[0][1] &&
                !updateWatch[0][1]
              ) {
                throw new Error("Failed");
              } else {
                let userPayload = await User.findOne({
                  where: { email: email },
                });
                if (userPayload) {
                  var dynamic_template_data = {
                    amount: amount,
                    symbol: symbol,
                    subject: "Egoras Deposit Confirmation",
                    name: userPayload.firstName + ", " + userPayload.lastName,
                  };
                  sendTemplate(
                    email,
                    process.env.FROM,
                    process.env.DEPOSIT_TEMPLATE_ID,
                    dynamic_template_data
                  );
                } else {
                  throw new Error("Failed");
                }
              }
            });
          }
        }
      });
    }
  } catch (error) {}
};

module.exports.eth = async (address, email, symbol, block, blockchain) => {
  //let addDeposit;
  try {
    //  addDeposit = await db.sequelize.transaction();
    let data = {
      address: address,
      block: block,
    };

    let urlResponse = await axios.post(
      process.env.BLOCKCHAIN_ENDPOINT + "ethereum/get/transactions",
      data
    );

    if (urlResponse.data.data.status == "1") {
      // console.log(urlResponse.data.data.status);
      urlResponse.data.data.result.forEach(async (deposit) => {
        await db.sequelize.transaction(async (addDeposit) => {
          if (deposit.to.toLowerCase() == address.toLowerCase()) {
            let findDepositHash = await Deposit.findOne({
              where: { hash: deposit.hash },
            });
            if (!findDepositHash) {
              let amount = parseInt(deposit.value) / 1000000000000000000;
              let addFund = await add(
                email,
                symbol,
                "portfolio",
                "value",
                amount,
                addDeposit
              );
              const enterHash = await Deposit.create(
                {
                  hash: deposit.hash,
                  blockchain: blockchain,
                },
                { transaction: addDeposit }
              );

              let ntPayload = {
                email: email,
                meta: {
                  symbol,
                  amount: amount.toString(),
                  type: "deposit",
                },
              };
              let createNt = await nt(ntPayload, addDeposit);

              let txPayload = {
                email: email,
                to_email: email,
                meta: {
                  symbol,
                  txh: deposit.hash,
                  confirmation: deposit.confirmations.toString() + "/3",
                  network: "Ethereum (ERC20)",
                  wallet_address: deposit.to,
                },

                amount: amount,
                type: "DEPOSIT",
                status: "SUCCESS",
              };
              let createTx = await tx(txPayload, addDeposit);
              let updateWatch = await Watch.update(
                { block: deposit.blockNumber },
                { where: { symbol, email: email } }
              );
              if (
                !addFund[0][1] &&
                !enterHash &&
                !createNt[0][1] &&
                !createTx[0][1] &&
                !updateWatch[0][1]
              ) {
                throw new Error("");
              } else {
                let userPayload = await User.findOne({
                  where: { email: email },
                });
                if (userPayload) {
                  var dynamic_template_data = {
                    amount: amount,
                    symbol: symbol,
                    subject: "Egoras Deposit Confirmation",
                    name: userPayload.firstName + ", " + userPayload.lastName,
                  };
                  sendTemplate(
                    email,
                    process.env.FROM,
                    process.env.DEPOSIT_TEMPLATE_ID,
                    dynamic_template_data
                  );
                } else {
                  throw new Error("");
                }
              }
            } else {
              throw new Error("");
            }
          } else {
            throw new Error("");
          }
        });
      });
    } else {
      throw new Error("");
    }
  } catch (error) {
    // addDeposit.rollback();
  }
};

module.exports.bnb = async (address, email, symbol, block, blockchain) => {
  //let addDeposit;
  try {
    //  addDeposit = await db.sequelize.transaction();
    let data = {
      address: address,
      block: block,
    };

    let urlResponse = await axios.post(
      process.env.BLOCKCHAIN_ENDPOINT + "binance/get/transactions",
      data
    );

    if (urlResponse.data.data.status == "1") {
      urlResponse.data.data.result.forEach(async (deposit) => {
        await db.sequelize.transaction(async (addDeposit) => {
          if (deposit.to.toLowerCase() == address.toLowerCase()) {
            let findDepositHash = await Deposit.findOne({
              where: { hash: deposit.hash },
            });
            if (!findDepositHash) {
              let amount = parseInt(deposit.value) / 1000000000000000000;
              let addFund = await add(
                email,
                symbol,
                "portfolio",
                "value",
                amount,
                addDeposit
              );
              const enterHash = await Deposit.create(
                {
                  hash: deposit.hash,
                  blockchain: blockchain,
                },
                { transaction: addDeposit }
              );

              let ntPayload = {
                email: email,
                meta: {
                  symbol,
                  amount: amount.toString(),
                  type: "deposit",
                },
              };
              let createNt = await nt(ntPayload, addDeposit);

              let txPayload = {
                email: email,
                to_email: email,
                meta: {
                  symbol,
                  txh: deposit.hash,
                  confirmation: deposit.confirmations.toString() + "/3",
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
                { where: { symbol, email: email } }
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
                  where: { email: email },
                });
                if (userPayload) {
                  var dynamic_template_data = {
                    amount: amount,
                    symbol: symbol,
                    subject: "Egoras Deposit Confirmation",
                    name: userPayload.firstName + ", " + userPayload.lastName,
                  };
                  sendTemplate(
                    email,
                    process.env.FROM,
                    process.env.DEPOSIT_TEMPLATE_ID,
                    dynamic_template_data
                  );

                  // throw new Error("");
                } else {
                  throw new Error("");
                }
              }
            } else {
              throw new Error("");
            }
          } else {
            throw new Error("");
          }
        });
      });
    } else {
      throw new Error("");
    }
  } catch (error) {}
};

module.exports.binanceToken = async (
  address,
  email,
  symbol,
  block,
  blockchain,
  contract
) => {
  console.log(":llllll");
  //let addDeposit;
  try {
    //addDeposit = await db.sequelize.transaction();
    let data = {
      contract: contract,
      address: address,
      block: block,
    };

    var instance = new web5.eth.Contract(abi, contract);

    const options = {
      filter: {
        to: address,
      },
      fromBlock: parseInt(block) + 1,
      toBlock: parseInt(block) + 3000,
    };
    let returned_event = [];
    returned_event = await instance.getPastEvents("Transfer", options);
    let blockNumber = await web5.eth.getBlockNumber();

    if (address === "0x65C1B1869784b54f00EacB96eA49d2273BF6fbA4") {
      console.log(returned_event, "6w66555ttt");
      console.log(contract, "6w66555ttt");
    }

    // let urlResponse = await axios.post(
    //   process.env.BLOCKCHAIN_ENDPOINT + "binance/get/token/transactions",
    //   data
    // );

    if (returned_event.length > 0) {
      returned_event.forEach(async (deposit) => {
        await db.sequelize.transaction(async (addDeposit) => {
          if (deposit.returnValues.to.toLowerCase() == address.toLowerCase()) {
            let findDepositHash = await Deposit.findOne({
              where: { hash: deposit.transactionHash },
            });
            if (!findDepositHash) {
              let amount =
                parseInt(deposit.returnValues.value) / 1000000000000000000;
              let addFund = await add(
                email,
                symbol,
                "portfolio",
                "value",
                amount,
                addDeposit
              );
              const enterHash = await Deposit.create(
                {
                  hash: deposit.transactionHash,
                  blockchain: blockchain,
                },
                { transaction: addDeposit }
              );

              let ntPayload = {
                email: email,
                meta: {
                  symbol,
                  amount: amount.toString(),
                  type: "deposit",
                },
              };
              let createNt = await nt(ntPayload, addDeposit);

              let txPayload = {
                email: email,
                to_email: email,
                meta: {
                  symbol,
                  txh: deposit.transactionHash,
                  confirmation: "3/3",
                  network: "BNB Smart Chain (BEP20)",
                  wallet_address: deposit.returnValues.to,
                },

                amount: amount,
                type: "DEPOSIT",
                status: "SUCCESS",
              };
              let createTx = await tx(txPayload, addDeposit);
              let updateWatch = await Watch.update(
                { block: deposit.blockNumber },
                { where: { symbol, email: email } }
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
                  where: { email: email },
                });
                if (userPayload) {
                  var dynamic_template_data = {
                    amount: amount,
                    symbol: symbol,
                    subject: "Egoras Deposit Confirmation",
                    name: userPayload.firstName + ", " + userPayload.lastName,
                  };
                  sendTemplate(
                    email,
                    process.env.FROM,
                    process.env.DEPOSIT_TEMPLATE_ID,
                    dynamic_template_data
                  );

                  //  throw new Error('');
                } else {
                  throw new Error("mmm");
                }
              }
            }
          } else {
            throw new Error("kkkkj");
          }
        });
      });
    } else {
      if (parseInt(block) + 4899 > blockNumber) {
        await Watch.update(
          { block: blockNumber },
          { where: { symbol, email: email } }
        );
      } else {
        await Watch.update(
          { block: parseInt(block) + 4899 },
          { where: { symbol, email: email } }
        );
      }

      //update block
    }
  } catch (error) {
    // console.log(
    //   "You're using more requests than are allowed in the free RPC service. Create a Premium RPC API to continue at https://rpc.ankr.com/bsc"
    // );
    // console.log(error);
  }
};

module.exports.ethereumToken = async (
  address,
  email,
  symbol,
  block,
  blockchain,
  contract
) => {
  // ;

  console.log("let addDeposit");
  try {
    // addDeposit = await db.sequelize.transaction();
    let data = {
      contract: contract,
      address: address,
      block: block,
    };

    console.log(data);

    var instance = new web4.eth.Contract(abi, contract);

    const options = {
      filter: {
        to: address,
      },
      fromBlock: parseInt(block) + 1,
      toBlock: parseInt(block) + 3000,
    };

    let returned_event = [];
    returned_event = await instance.getPastEvents("Transfer", options);
    let blockNumber = await web4.eth.getBlockNumber();

    console.log(returned_event);

    if (returned_event.length > 0) {
      returned_event.forEach(async (deposit) => {
        if (deposit.returnValues.to !== undefined) {
          await db.sequelize.transaction(async (addDeposit) => {
            if (
              deposit.returnValues.to.toLowerCase() == address.toLowerCase()
            ) {
              let findDepositHash = await Deposit.findOne({
                where: { hash: deposit.transactionHash },
              });
              if (!findDepositHash) {
                let amount =
                  parseInt(deposit.returnValues.value) / 1000000000000000000;
                let addFund = await add(
                  email,
                  symbol,
                  "portfolio",
                  "value",
                  amount,
                  addDeposit
                );
                const enterHash = await Deposit.create(
                  {
                    hash: deposit.transactionHash,
                    blockchain: blockchain,
                  },
                  { transaction: addDeposit }
                );

                let ntPayload = {
                  email: email,
                  meta: {
                    symbol,
                    amount: amount.toString(),
                    type: "deposit",
                  },
                };
                let createNt = await nt(ntPayload, addDeposit);

                let txPayload = {
                  email: email,
                  to_email: email,
                  meta: {
                    symbol,
                    txh: deposit.transactionHash,
                    confirmation: "3/3",
                    network: "Ethereum (ERC20)",
                    wallet_address: deposit.returnValues.to,
                  },

                  amount: amount,
                  type: "DEPOSIT",
                  status: "SUCCESS",
                };
                let createTx = await tx(txPayload, addDeposit);
                let updateWatch = await Watch.update(
                  { block: deposit.blockNumber },
                  { where: { symbol, email: email } }
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
                    where: { email: email },
                  });
                  if (userPayload) {
                    var dynamic_template_data = {
                      amount: amount,
                      symbol: symbol,
                      subject: "Egoras Deposit Confirmation",
                      name: userPayload.firstName + ", " + userPayload.lastName,
                    };
                    sendTemplate(
                      email,
                      process.env.FROM,
                      process.env.DEPOSIT_TEMPLATE_ID,
                      dynamic_template_data
                    );

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
    } else {
      if (parseInt(block) + 4899 > blockNumber) {
        await Watch.update(
          { block: blockNumber },
          { where: { symbol, email: email } }
        );
      } else {
        await Watch.update(
          { block: parseInt(block) + 4899 },
          { where: { symbol, email: email } }
        );
      }
    }
  } catch (error) {
    //addDeposit.rollback();
    console.log(error);
  }
};
