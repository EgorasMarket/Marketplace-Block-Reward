const { errorResponse, successResponse } = require("../../helpers");

const axios = require("axios").default;
const { Asset, Wallet, Watch } = require("../../models/index");
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
    return successResponse(req, res, {
      events: returned_event,
      currentBlock: blockNumber,
    });
  } catch (error) {
    console.log(error, "houjo");
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
        if (symbol === "NGNC") {
          let watch = await EgoWatch.findOne({
            where: { symbol: "NGNC", email: email },
          });
          if (watch) {
            await EgoWatch.update(
              { symbol, email: email },
              { where: { symbol, email: email } }
            );
          } else {
            await EgoWatch.create({
              symbol: "NGNC",
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
exports.mint = async ({ amount, address }) => {};
exports.burn = async ({ amount, address }) => {};
