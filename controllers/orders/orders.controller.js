const axios = require("axios").default;

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
  Asset,
  Stake,
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
const { symbol } = require("joi");

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

      console.log(placeOrder[0][2].id, "makachi");
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
          purchase_id: placeOrder[0][2].id,
        },
        {
          transaction: processPurchase,
        }
      );
      if (
        !deductQuantity[0][1] &&
        !placeOrder[0][1] &&
        !createTx[0][1] &&
        !deductPortfolio[0][1] &&
        !prod_stake
      ) {
        console.log("kjoijoijoi");
        processPurchase.rollback();
      }
      // await fundUserWalletOnSuccessfulPurchase();
      //run the stake algorithm to ensure workability
    });

    return successResponse(req, res, {});
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

// export const settleCashoutCrypto = async ({}) => {
//   try {
//     const pendingTransaction = await Transactions.findAll({
//       where: { status: "ADMIN_APPROVED", type: "WIITHDRAWAL" },
//     });

//     // console.log(allAssets);

//     pendingTransaction.map(async (cashout, index) => {
//       console.log(JSON.parse(cashout.meta).wallet_address);
//       let walletNew = JSON.parse(cashout.meta).wallet_address;
//       let amount = JSON.parse(cashout.meta).to_send;
//       let symbol = JSON.parse(cashout.meta).symbol;
//       let networks = JSON.parse(cashout.meta).network;

//       function removeWhitespace(str) {
//         return str.replace(/\s/g, "");
//       }

//       const wallet = removeWhitespace(walletNew);

//       let mainValue = parseFloat(amount) * 1000000000000000000;

//       if (symbol === "USD" || symbol === "EGC" || symbol === "ESTA") {
//         // const allAssets = await Asset.findOne({
//         //   where: { symbol },
//         // });

//         // console.log(allAssets.contract, "dndnd");
//         // console.log(allAssets.contract, "dndnd");

//         const updateTransaction = await Transactions.update(
//           { status: "FAILED" },
//           { where: { id: cashout.id } }
//         );
//         console.log(updateTransaction[0]); //FAILED

//         const lowercaseString = networks.toLowerCase();

//         if (symbol === "USD" && lowercaseString === "egochain") {
//           const newAsset = await Asset.findOne({
//             where: { symbol: symbol + "E" },
//           });
//           if (updateTransaction[0]) {
//             let blockChainPayload = {
//               privateKey: process.env.PVCT,
//               contractAddress: newAsset.contract,
//               method: "transfer",
//               rpcURL: "https://mainnet.egochain.org",
//               params: [`${wallet}`, `${mainValue}`],
//               type: "write",
//               abi: [
//                 {
//                   constant: false,
//                   inputs: [
//                     {
//                       name: "_to",
//                       type: "address",
//                     },
//                     {
//                       name: "_value",
//                       type: "uint256",
//                     },
//                   ],
//                   name: "transfer",
//                   outputs: [
//                     {
//                       name: "",
//                       type: "bool",
//                     },
//                   ],
//                   payable: false,
//                   stateMutability: "nonpayable",
//                   type: "function",
//                 },
//               ],
//             };

//             // console.log(blockChainPayload);

//             // Make a POST request using Axios
//             axios
//               .post(
//                 "https://bx.hollox.finance/mcw/send/to/erc20/chains",
//                 blockChainPayload
//                 // config
//               )
//               .then((response) => {
//                 // Handle successful response here
//                 console.log("Response data:", response.data.data.data.data);

//                 let ffff = {
//                   ...response.data.data.data.data,
//                   ...JSON.parse(cashout.meta),
//                 };

//                 if (response.data.success == true) {
//                   Transactions.update(
//                     { status: "SUCCESS", meta: ffff },
//                     { where: { id: cashout.id } }
//                   );
//                 }
//               })
//               .catch((error) => {
//                 // Handle error here
//                 console.error("Error: Withdrawal failed");
//               })
//               .finally(() => {
//                 // This block is executed regardless of success or failure
//                 console.log("Request completed");
//               });
//           }
//         } else if (symbol === "ESTA" && lowercaseString === "egochain") {
//           const newAsset = await Asset.findOne({
//             where: { symbol: symbol + "E" },
//           });
//           if (updateTransaction[0]) {
//             let blockChainPayload = {
//               privateKey: process.env.PVCT,
//               contractAddress: newAsset.contract,
//               method: "transfer",
//               rpcURL: "https://mainnet.egochain.org",
//               params: [`${wallet}`, `${mainValue}`],
//               type: "write",
//               abi: [
//                 {
//                   inputs: [
//                     {
//                       internalType: "address",
//                       name: "to_",
//                       type: "address",
//                     },
//                     {
//                       internalType: "uint256",
//                       name: "value_",
//                       type: "uint256",
//                     },
//                   ],
//                   name: "transfer",
//                   outputs: [
//                     {
//                       internalType: "bool",
//                       name: "",
//                       type: "bool",
//                     },
//                   ],
//                   stateMutability: "nonpayable",
//                   type: "function",
//                 },
//               ],
//             };

//             // console.log(blockChainPayload);

//             // Make a POST request using Axios
//             axios
//               .post(
//                 "https://bx.hollox.finance/mcw/send/to/erc20/chains",
//                 blockChainPayload
//                 // config
//               )
//               .then((response) => {
//                 // Handle successful response here
//                 console.log("Response data:", response.data.data.data.data);

//                 let ffff = {
//                   ...response.data.data.data.data,
//                   ...JSON.parse(cashout.meta),
//                 };

//                 if (response.data.success == true) {
//                   Transactions.update(
//                     { status: "SUCCESS", meta: ffff },
//                     { where: { id: cashout.id } }
//                   );
//                 }
//               })
//               .catch((error) => {
//                 // Handle error here
//                 console.error("Error: Withdrawal failed");
//               })
//               .finally(() => {
//                 // This block is executed regardless of success or failure
//                 console.log("Request completed");
//               });
//           }
//         } else if (
//           symbol === "ESTA" &&
//           (networks === "Ethereum (ERC20)" || lowercaseString === "ethereum")
//         ) {
//           const newAsset = await Asset.findOne({
//             where: { symbol: symbol },
//           });
//           if (updateTransaction[0]) {
//             // contract, address, privateKey, amount;

//             let blockChainPayload = {
//               privateKey: process.env.PVCT,
//               contractAddress: newAsset.contract,
//               method: "transfer",
//               rpcURL: "https://eth.drpc.org",
//               params: [`${wallet}`, `${mainValue}`],
//               type: "write",
//               abi: [
//                 {
//                   constant: false,
//                   inputs: [
//                     {
//                       name: "_to",
//                       type: "address",
//                     },
//                     {
//                       name: "_value",
//                       type: "uint256",
//                     },
//                   ],
//                   name: "transfer",
//                   outputs: [
//                     {
//                       name: "",
//                       type: "bool",
//                     },
//                   ],
//                   payable: false,
//                   stateMutability: "nonpayable",
//                   type: "function",
//                 },
//               ],
//             };
//             // let blockChainPayload = {
//             //   privateKey: process.env.PVCT,
//             //   contract: newAsset.contract,
//             //   amount: mainValue,
//             //   address: wallet,
//             // };

//             // console.log(blockChainPayload);

//             // Make a POST request using Axios
//             axios
//               .post(
//                 "https://bx.hollox.finance/mcw/send/to/erc20/chains",
//                 blockChainPayload
//                 // config
//               )
//               .then((response) => {
//                 // Handle successful response here
//                 console.log("Response data:", response.data.data.data.data);

//                 let ffff = {
//                   ...response.data.data.data.data,
//                   ...JSON.parse(cashout.meta),
//                 };

//                 if (response.data.success == true) {
//                   Transactions.update(
//                     { status: "SUCCESS", meta: ffff },
//                     { where: { id: cashout.id } }
//                   );
//                 }
//               })
//               .catch((error) => {
//                 // Handle error here
//                 console.error("Error: Withdrawal failed");
//               })
//               .finally(() => {
//                 // This block is executed regardless of success or failure
//                 console.log("Request completed");
//               });
//           }
//         } else {
//           const newAsset = await Asset.findOne({
//             where: { symbol: symbol },
//           });
//           if (updateTransaction[0]) {
//             let blockChainPayload = {
//               privateKey: process.env.PVCT,
//               contractAddress: newAsset.contract,
//               method: "transfer",
//               rpcURL: "https://bsc-dataseed1.binance.org",
//               params: [`${wallet}`, `${mainValue}`],
//               type: "write",
//               abi: [
//                 {
//                   constant: false,
//                   inputs: [
//                     {
//                       name: "_to",
//                       type: "address",
//                     },
//                     {
//                       name: "_value",
//                       type: "uint256",
//                     },
//                   ],
//                   name: "transfer",
//                   outputs: [
//                     {
//                       name: "",
//                       type: "bool",
//                     },
//                   ],
//                   payable: false,
//                   stateMutability: "nonpayable",
//                   type: "function",
//                 },
//               ],
//             };

//             // console.log(blockChainPayload);

//             // Make a POST request using Axios
//             axios
//               .post(
//                 "https://bx.hollox.finance/mcw/send/to/erc20/chains",
//                 blockChainPayload
//                 // config
//               )
//               .then((response) => {
//                 // Handle successful response here
//                 console.log("Response data:", response.data.data.data.data);

//                 let ffff = {
//                   ...response.data.data.data.data,
//                   ...JSON.parse(cashout.meta),
//                 };

//                 if (response.data.success == true) {
//                   Transactions.update(
//                     { status: "SUCCESS", meta: ffff },
//                     { where: { id: cashout.id } }
//                   );
//                 }
//               })
//               .catch((error) => {
//                 // Handle error here
//                 console.error("Error: Withdrawal failed");
//               })
//               .finally(() => {
//                 // This block is executed regardless of success or failure
//                 console.log("Request completed");
//               });
//           }
//         }
//       } else {
//         const updateTransaction = await Transactions.update(
//           { status: "FAILED" },
//           { where: { id: cashout.id } }
//         );
//         console.log(updateTransaction[0]); //FAILED

//         if (updateTransaction[0]) {
//           let blockChainPayload = {
//             recipientAddress: wallet,
//             amount: parseFloat(amount),
//             network: "ethereum",
//             rpcUrl: "https://mainnet.egochain.org",
//             privateKey: process.env.EGAXDIS,
//           };

//           try {
//             // Make a POST request using Axios
//             await axios
//               .post(
//                 "https://bx.hollox.finance/mcw/send/evm/token",
//                 blockChainPayload
//                 // config
//               )
//               .then((response) => {
//                 // Handle successful response here
//                 console.log("Response:", response.data.data);

//                 let ffff = {
//                   ...response.data.data,
//                   ...JSON.parse(cashout.meta),
//                 };
//                 // console.log(ffff);

//                 if (response.data.success == true) {
//                   Transactions.update(
//                     { status: "SUCCESS", meta: ffff },
//                     { where: { id: cashout.id } }
//                   );
//                   console.log("Your EGAX Token is on the way!!");
//                   // return successResponse(req, res, {
//                   //   message: `Your EGAX Token is on the way!!!`,
//                   // });
//                 }
//               })
//               .catch((error) => {
//                 // Handle error here
//                 console.error("Error: Failed", error);
//               });
//           } catch (error) {
//             console.log(error);
//           }
//         }
//       }
//     });
//     return successResponse(req, res, {});
//   } catch (error) {
//     console.log("error");
//     console.log(error);
//     return errorResponse(req, res, error.message);
//   }
// };

exports.settle = async ({
  wallet,
  symbol,
  network,
  amount,
  user_id,
  stake_id,
}) => {
  //OBTAIN CONTRACT ADDRESS USING SYMBOL
  const asset = Asset.findOne({
    where: {
      symbol,
    },
  });
  if (!asset)
    return {
      success: false,
    };

  let blockChainPayload = {
    privateKey: process.env.PVCT,
    contractAddress: asset.contract,
    method: "transfer",
    rpcURL: "https://mainnet.egochain.org",
    params: [`${wallet}`, `${amount}`],
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
        // Transactions.update(
        //   { status: "SUCCESS", meta: ffff },
        //   { where: { id: cashout.id } }
        // );
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
};
function removeWhitespace(str) {
  return str.replace(/\s/g, "");
}
