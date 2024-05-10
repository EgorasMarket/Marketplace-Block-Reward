const axios = require("axios");
const { Asset, Wallet, Watch, Deposit, User, Pending } = require("../models");
const { Op } = require("sequelize");
const db = require("../config/sequelize");
var { sendTemplate } = require("../helpers/utils");
const { tx, nt, add } = require("../helpers");

module.exports.egochainToken = async (
  address,
  email,
  symbol,
  block,
  blockchain,
  contract
) => {
  try {
    let data = {
      contract: contract,
      address: address,
      block: block,
    };

    let urlResponse = await axios.post(
      process.env.BLOCKCHAIN_ENDPOINT + "binance/get/token/transactions",
      data
    );

    console.log(urlResponse.data.data.events, "6w66555ttt");

    if (urlResponse.data.success) {
      if (urlResponse.data.data.events.length > 0) {
        urlResponse.data.data.events.forEach(async (deposit) => {
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
      } else {
        if (parseInt(block) + 4899 > urlResponse.data.data.currentBlock) {
          await Watch.update(
            { block: urlResponse.data.data.currentBlock },
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
    } else {
      console.log("errorrrr");
      throw new Error("");
    }
  } catch (error) {
    console.log("error orrores");
    console.log(error);
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
  // let addDeposit;
  try {
    // addDeposit = await db.sequelize.transaction();
    let data = {
      contract: contract,
      address: address,
      block: block,
    };

    let urlResponse = await axios.post(
      process.env.BLOCKCHAIN_ENDPOINT + "ethereum/get/token/transactions",
      data
    );

    if (urlResponse.data.success) {
      if (urlResponse.data.data.events.length > 0) {
        urlResponse.data.data.events.forEach(async (deposit) => {
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
    } else {
      throw new Error("");
    }
  } catch (error) {
    //addDeposit.rollback();
    console.log(error);
  }
};
