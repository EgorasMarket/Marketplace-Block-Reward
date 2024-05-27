const Joi = require("joi");

exports.getOtherUserProfile = {
  body: {
    userId: Joi.number().required(),
  },
};

exports.changePassword = {
  body: {
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().required(),
  },
};

exports.initialAdd = {
  body: {
    // product_image: Joi.string().required(),
    product_name: Joi.string().required(),
    product_brand: Joi.string().required(),
    product_condition: Joi.string().required(),
    amount: Joi.string().required(),
    productType: Joi.string().required(),
    productQuantity: Joi.string().required(),
    userAddress: Joi.string().required(),
  },
};

exports.initialAddDirect = {
  body: {
    // product_image: Joi.string().required(),
    product_name: Joi.string().required(),
    product_brand: Joi.string().required(),
    product_category: Joi.string().required(),
    product_details: Joi.string().required(),
    prod_spec: Joi.string().required(),
    product_state: Joi.string().required(),
    productQuantity: Joi.string().required(),
    product_amount: Joi.string().required(),
    productType: Joi.string().required(),
    userAddress: Joi.string().required(),
  },
};

exports.updateProduct = {
  body: {
    product_id: Joi.string().required(),
    product_name: Joi.string().required(),
    product_brand: Joi.string().required(),
    product_category: Joi.string().required(),
    product_spec: Joi.string().required(),
    // amount: Joi.string().required(),
    product_details: Joi.string().required(),
    adminAddr: Joi.string().required(),
  },
};

exports.login = {
  body: {
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  },
};