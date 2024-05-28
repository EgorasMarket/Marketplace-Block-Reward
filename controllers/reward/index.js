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
  RewardConfig,
  User,
  Portfolio,
  PurchaseOrder,
  DeliveryDetails,
  Asset,
  Stake,

  Sequelize,
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

exports.distribute_reward = async (req, res) => {
  try {
    //get the total stake carried out in the record
    let total_stake = 0.0;
    const sumStake = await Stake.findAll({});

    //fetch amount allocated for pool
    const rewardConfig = await RewardConfig.findOne();

    if (!rewardConfig) return;

    const amount_in_pool = rewardConfig.reward_pool;
    let userShare = 0.0;
    let userReward = 0.0;
    console.log(rewardConfig, "lll");

    for (const stake of sumStake) {
      console.log(stake);
      total_stake += parseFloat(stake.purchase_val);
    }

    //get user reward

    for (const stakes of sumStake) {
      userShare = parseFloat(stakes.purchase_val / total_stake);
      console.log(userShare, "alal");

      userReward = amount_in_pool * userShare;
      console.log(userReward, "blord");

      //update Reward
      await Stake.update(
        {
          rewards_earned:
            parseFloat(stakes.rewards_earned) + parseFloat(userReward),
        },
        {
          where: {
            user_id: stakes.user_id,
          },
        }
      );

      //
    }

    successResponse(req, res, { rewardConfig, sumStake, total_stake });
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};
