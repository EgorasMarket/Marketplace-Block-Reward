const Joi = require('joi');

export const get = {
  body: {
    symbol: Joi.string().required()
  },
};