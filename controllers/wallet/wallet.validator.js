const Joi = require("joi");

exports.get = {
  body: {
    symbol: Joi.string().required(),
  },
};
