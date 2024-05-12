const Joi = require("joi");

exports.cashout = {
  body: {
    amount: Joi.number().greater(0).required(),
    symbol: Joi.string().required(),
    bank_info: Joi.object()
      .keys({
        bank_code: Joi.string().required(),
        account_number: Joi.string().required(),
        bank_name: Joi.string().required(),
        account_name: Joi.string().required(),
      })
      .required(),
  },
};

exports.external = {
  body: {
    amount: Joi.number().required(),
    symbol: Joi.string().required(),
    network: Joi.string().required(),
    wallet_address: Joi.string().required(),
  },
};

exports.int = {
  body: {
    symbol: Joi.string().required(),
    int: Joi.string().required(),
  },
};
exports.internal = {
  body: {
    username_email: Joi.string().required(),
    amount: Joi.number().required(),
    symbol: Joi.string().required(),
  },
};

exports.getUser = {
  body: {
    username_email: Joi.string().required(),
  },
};
