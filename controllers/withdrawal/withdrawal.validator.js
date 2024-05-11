const Joi = require('joi');

export const cashout = {
  body: {
    amount: Joi.number().greater(0).required(),
    symbol: Joi.string().required(),
    bank_info: Joi.object().keys({
      bank_code: Joi.string().required(),
      account_number: Joi.string().required(),
      bank_name: Joi.string().required(),
      account_name: Joi.string().required(),
    }).required()
  },
};

export const external = {
  body: {
    amount: Joi.number().required(),
    symbol: Joi.string().required(),
    network: Joi.string().required(),
    wallet_address: Joi.string().required(),
  },
};

export const int = {
  body: {
   
    symbol: Joi.string().required(),
    int: Joi.string().required(),
   
   
  },
};
export const internal = {
  body: {
    username_email: Joi.string().required(),
    amount: Joi.number().required(),
    symbol: Joi.string().required(),
   
  },
};

export const getUser = {
  body: {
    username_email: Joi.string().required(),
  },
};