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
    PurchaseOrder
 } = require("../../models");
const {
  successResponse,
  errorResponse,
  DeductQuantity,
  deduct,
  addOrder,
  tx,
  uniqueId,
  success,
} = require("../../helpers");


exports.PurchaseProduct = async (req, res) => {
    try {
        const {
            product_id,
            quantity
        } = req.body;

        const { userId, email } = req.user;

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
                quantity
            };
            let deductQuantity = await DeductQuantity(
                depPayload,
                processPurchase
            );

            let puPayload = {
                email,
                product_id,
                quantity,
                amount: finalAmount
            };

            let placeOrder = await addOrder(
                puPayload,
                processPurchase
            );

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
                meta: { type: "Product", product_id, quantity, amount: finalAmount, symbol: "EGAX" },
                amount: finalAmount,
                type: "PURCHASE",
                status: "PENDING",
              };
              let createTx = await tx(txPayload, processPurchase);

            if (
                !deductQuantity[0][1] &&
                !placeOrder[0][1] &&
                !createTx[0][1] &&
                !deductPortfolio[0][1]
              ) {
                console.log("kjoijoijoi");
                processPurchase.rollback();
              }
            
        });
    
      return successResponse(req, res, {  });
    } catch (error) {
      return errorResponse(req, res, error.message);
    }
};