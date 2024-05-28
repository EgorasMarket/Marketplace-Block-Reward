const db = require("../../config/sequelize");
const { Op } = require("sequelize");
const imgur = require("imgur");
const path = require("path");

const uuid = require("uuid").v4;

var fs = require("fs");

const { 
    Product,
    User,
    Portfolio,
    PurchaseOrder,
    DeliveryDetails,
    Stake
 } = require("../../models");
const {
  successResponse,
  errorResponse,
  DeductQuantity,
  deduct,
  addOrder,
  tx,
  add,
} = require("../../helpers");

// //send the user the relevant 404 token to managed wallet

exports.PurchaseProduct = async (req, res) => {
  try {
    const { product_id, quantity } = req.body;

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

    if (!checkBalance) {
      throw new Error("Insufficient balance to purchase this item.");
    }

    let finalAmount = parseFloat(checkProduct.amount) * parseInt(quantity);

    if (finalAmount > parseFloat(checkBalance.value)) {
      throw new Error("Insufficient balance to purchase this item.");
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
      };

      let placeOrder = await addOrder(puPayload, processPurchase);

      // createPurchase =  await PurchaseOrder.create(puPayload, { transaction: t });
      // createPurchase =  await PurchaseOrder.create(puPayload, { transaction: t });

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
      const prod_stake = await ProductStake(
        {
          product: checkProduct,
          quantity,
          user: req.user,
          // user_id: isUser.id,
          purchase_val: finalAmount,
          transaction: processPurchase,
        },
        {
          transaction: processPurchase,
        }
      );

      console.log(prod_stake, 'jjjji');
      if (
        !deductQuantity[0][1] &&
        !placeOrder[0][1] &&
        !createTx[0][1] &&
        !deductPortfolio[0][1] &&
        !prod_stake
      ) {
        console.log("kjoijoijoi");
        processPurchase.rollback();
        return errorResponse(req, res, {message: "An error eccurred, try again"});
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
        const {
            fullname,
            phoneNumber,
            country,
            telegramId
        } = req.body;

        const { userId, email } = req.user;

        console.log(
            fullname,
            phoneNumber,
            country,
            telegramId
        );

        await DeliveryDetails.create(
            { 
                email,
                fullname,
                phoneNumber,
                country,
                telegramId,
            },
            
          );

       
    
      return successResponse(req, res, {  });
    } catch (error) {
      return errorResponse(req, res, error.message);
    }
};

const fundUserWalletOnSuccessfulPurchase = async ({ stake_id, user_id }) => {};

const ProductStake = async ({
  product,
  user,
  quantity,
  purchase_val,
  transaction,
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
