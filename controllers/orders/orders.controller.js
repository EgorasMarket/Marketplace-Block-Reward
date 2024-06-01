const axios = require("axios").default;

const db = require("../../config/sequelize");
const { Op } = require("sequelize");
const imgur = require("imgur");
const path = require("path");

const uuid = require("uuid").v4;

var fs = require("fs");

const {
  Product,
  Transactions,
  User,
  Portfolio,
  PurchaseOrder,
  DeliveryDetails,
  Asset,
  Stake,
  Referral,
  RefEarning,
} = require("../../models");
const {
  successResponse,
  errorResponse,
  DeductQuantity,
  deduct,
  addOrder,
  tx,
  add,
  AddRefEarnings,
  UpdateRefBalance
} = require("../../helpers");
const { symbol } = require("joi");
const { log } = require("util");

// //send the user the relevant 404 token to managed wallet
// //send the user the relevant 404 token to managed wallet

exports.PurchaseProduct = async (req, res) => {
  try {
    const { product_id, quantity, deliveryMethod } = req.body;

    const { userId, email } = req.user;
    console.log(req.user);

    console.log(product_id, quantity, email, "ooio");

    const isUser = await User.findOne({
      where: {
        id: userId,
      },
    });

    if (!isUser) throw new Error("Cannot validate user");

    const checkProduct = await Product.findOne({
      where: {
        id: parseInt(product_id),
      },
    });

    if (!checkProduct) throw new Error("Product does not exist.");

    if (checkProduct.quantity === 0) {
      throw new Error("Product is out of stock.");
    }

    if (checkProduct.quantity < quantity) {
      throw new Error("Order quantity exceeds stock.");
    }

    const checkBalance = await Portfolio.findOne({
      where: {
        email: email,
        symbol: "EGAX",
      },
    });

    
    let earnings = 0;
    
    const findReferral = await Referral.findOne({
      where: {
        userId: isUser.swapRef,
      },
    });
    console.log(findReferral.refererId, 'LLOO((');

    const referrer = await User.findOne({
      where: {
        swapRef: findReferral.refererId,
      },
    });
    console.log(referrer, "kkop");

    if (!checkBalance) {
      throw new Error("Insufficient balance to purchase this item.");
    }

    let finalAmount = parseFloat(checkProduct.amount) * parseInt(quantity);

    if (finalAmount > parseFloat(checkBalance.value)) {
      throw new Error("Insufficient balance to purchase this item.");
    }

    if (findReferral) {
      earnings = finalAmount * 0.10;
    }

    await db.sequelize.transaction(async (processPurchase) => {
      console.log("ioioioi");
      let depPayload = {
        product_id,
        quantity,
      };
      let deductQuantity = await DeductQuantity(depPayload, processPurchase);

      let puPayload = {
        email,
        product_id,
        quantity,
        amount: finalAmount,
        deliveryType: deliveryMethod,
      };

      let placeOrder = await addOrder(puPayload, processPurchase);

      console.log(placeOrder[0][2].id, "makachi");

      let deductPortfolio = await deduct(
        email,
        "EGAX",
        "portfolio",
        "value",
        finalAmount,
        processPurchase
      );

      let txPayload = {
        email: req.user.email,
        to_email: req.user.email,
        meta: {
          type: "Product",
          product_id,
          quantity,
          amount: finalAmount,
          symbol: "EGAX",
        },
        amount: finalAmount,
        type: "PURCHASE",
        status: "PENDING",
      };
      let createTx = await tx(txPayload, processPurchase);

      let addEarn = false;
      let incrRefEarn = false;

      if (earnings != 0) {
        let earnPayload = {
          referral: email,
          email: referrer.email,
          product_id,
          quantity,
          amount: finalAmount,
          earnings
        }

        let addEarnal = await AddRefEarnings(earnPayload, processPurchase);

        console.log(findReferral.userId,
          findReferral.refererId, "KHJVCB");

        let sendrefPayload = await UpdateRefBalance(
          "amount",
          findReferral.userId,
          findReferral.refererId,
          earnings,
          processPurchase
        );


        // console.log(addEarnal[0][1], "LLLK");

        if (addEarnal[0][1] == true) {
          addEarn = true
        }

        if (sendrefPayload[0][1] == true) {
          incrRefEarn = true
        }

      }

      console.log(addEarn, placeOrder[0][1], "HHHHHJJ");

      const prod_stake = await ProductStake(
        {
          product: checkProduct,
          quantity,
          user: req.user,
          // user_id: isUser.id,
          purchase_val: finalAmount,
          transaction: processPurchase,
          purchase_id: placeOrder[0][2].id,
        },
        {
          transaction: processPurchase,
        }
      );

      const settlement = await this.settle({
        wallet_address: req.user.wallet_address,
        amount: quantity,
        symbol: checkProduct.token_type,
        user_id: req.user.userId,
        email: req.user.email,
        transaction: processPurchase,
      });
      console.log(settlement, "ass");
      if (
        !deductQuantity[0][1] ||
        !placeOrder[0][1] ||
        !createTx[0][1] ||
        !addEarn ||
        !incrRefEarn ||
        !deductPortfolio[0][1]
      ) {
        console.log("kjoijoijoi");
        processPurchase.rollback();
        return errorResponse(req, res, {
          message: "An error eccurred, try again",
        });
      } else {
        return successResponse(req, res, {});
      }
      // await fundUserWalletOnSuccessfulPurchase();
      //run the stake algorithm to ensure workability
    });
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

exports.SubmitDelivery = async (req, res) => {
  try {
    const { fullname, phoneNumber, country, telegramId } = req.body;

    const { userId, email } = req.user;

    console.log(fullname, phoneNumber, country, telegramId);

    await DeliveryDetails.create({
      email,
      fullname,
      phoneNumber,
      country,
      telegramId,
    });

    return successResponse(req, res, {});
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

exports.getBoughtProducts = async (req, res) => {
  try {
    let user = req.user.email;

    let query = `SELECT PurchaseOrders.*, Products.user_wallet, Products.product_name, Products.product_images, Products.product_brand FROM PurchaseOrders JOIN Products ON PurchaseOrders.product_id = Products.id JOIN Users ON Users.email = PurchaseOrders.email WHERE Users.email = '${user}'`;
    const result = await db.sequelize.query(query);
    console.log(result, "llll");

    // console.log(result);
    return successResponse(req, res, result[0]);
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

const ProductStake = async ({
  product,
  user,
  quantity,
  purchase_val,
  transaction,
  purchase_id,
}) => {
  //fetch token_id =
  const { userId, email } = user;
  //grab the product and extract the token type

  try {
    const { token_type } = product; //extract the token type from payload

    const result = await Stake.create(
      {
        user_id: userId,
        token_id: token_type,
        amount_staked: quantity,
        start_date: new Date(),
        rewards_earned: 0.0,
        purchase_val,
        purchase_id,
      },
      {
        transaction,
      }
    );

    //add to portfolio

    const addToPortfolio = await add(
      email,
      token_type,
      "portfolio",
      "value",
      quantity,
      transaction
    );

    if (result && addToPortfolio) {
      console.log("result yes");
      return {
        success: true,
      };
    }

    return {
      success: false,
      error: "cannot complete",
    };
  } catch (err) {
    console.log("result no");
    console.log(err.message);

    return {
      success: false,
      error: err.message,
    };
  }
  //collect user information and token info then add to stake table
};

exports.SubmitDelivery = async (req, res) => {
  try {
    const { fullname, phoneNumber, country, telegramId } = req.body;

    const { userId, email } = req.user;

    console.log(fullname, phoneNumber, country, telegramId);

    await DeliveryDetails.create({
      email,
      fullname,
      phoneNumber,
      country,
      telegramId,
    });

    return successResponse(req, res, {});
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

exports.settle = async ({
  wallet_address,
  symbol,
  network,
  amount,
  user_id,
  stake_id,
  email,
  transaction,
}) => {
  //OBTAIN CONTRACT ADDRESS USING SYMBOL

  const newAsset = await Asset.findOne({
    where: { symbol },
  });
  let mainValue = parseFloat(amount) * 1000000000000000000;

  console.log(newAsset, "asss");
  let blockChainPayload = {
    privateKey: process.env.PVCT,
    contractAddress: newAsset.contract,
    method: "transfer",
    rpcURL: "https://mainnet.egochain.org",
    params: [`${wallet_address}`, `${mainValue}`],
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
      console.log("Goodluck:", response.data.data.data);

      // let ffff = {
      //   ...response.data.data.data.data,
      //   ...JSON.parse(cashout.meta),
      // };

      if (response.data.success == true) {
        const meta = {
          ...response.data.data.data.data,
          stake_id,
        };
        Transactions.create(
          {
            status: "SUCCESS",
            meta,
            type: "NFT-CREDIT",
            amount,
            email,
            to_email: email,
          },
          {
            // transaction,
          }
        );
      }
    })
    .catch((error) => {
      // Handle error here
      // transaction.rollback();
      console.error("Error: Withdrawal failed", error.response);
    })
    .finally(() => {
      // This block is executed regardless of success or failure
      console.log("Request complyhoeted");
    });
};
function removeWhitespace(str) {
  return str.replace(/\s/g, "");
}
