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
  RewardPool,
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

    const amount_in_pool = parseFloat(rewardConfig.reward_pool);

    console.log(rewardConfig, "lll");

    for (const stake of sumStake) {
      total_stake += parseFloat(stake.purchase_val);
    }

    //status

    const promises = [];
    //get user reward
    console.log(total_stake, "totak_stake");
    for (const stakes of sumStake) {
      let userShare = 0.0;
      let userReward = 0.0;
      userShare = parseFloat(stakes.purchase_val) / total_stake;
      console.log(userShare, "user_share");

      userReward = amount_in_pool * userShare;
      console.log(userReward, "user_reward");
      const promise = Stake.update(
        {
          rewards_earned:
            parseFloat(stakes.rewards_earned) + parseFloat(userReward),
        },
        {
          where: {
            user_id: stakes.user_id,
            stake_id: stakes.stake_id,
          },
        }
      ).then((res) => {
        console.log(res);
      });

      const promise2 = await RewardPool.create({
        user_id: stakes.user_id,
        reward: userReward,
        allocated_pool_value: amount_in_pool,
      });
      promises.push(promise);
      promises.push(promise2);
    }

    Promise.all(promises).then((result) => {
      console.log(result);
    });

    successResponse(req, res, { rewardConfig, sumStake, total_stake });
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};
exports.showFundsInLP = async (req, res) => {
  try {
    //fetch amount allocated for pool
    const rewardConfig = await RewardConfig.findOne();

    if (!rewardConfig) return;

    const amount_in_pool = parseFloat(rewardConfig.reward_pool);

    successResponse(req, res, { amount_in_pool });
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};
