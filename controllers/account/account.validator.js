const Joi = require("joi");

exports.verifyBVNorNIN = {
  body: {
    type: Joi.string().required(),
    code: Joi.string().required(),
  },
};
exports.add = {
  body: {
    bank: Joi.string().required(),
    name: Joi.string().required(),
    number: Joi.string().required(),
  },
};

exports.verify = {
  body: {
    nin: Joi.string().required(),
    dob: Joi.string().required(),
  },
};
exports.DeleteBank = {
  body: {
    id: Joi.string().required(),
  },
};

exports.addBank = {
  body: {
    bank_name: Joi.string().required(),
    bank_code: Joi.string().required(),
  },
};

exports.getAccountInfo = {
  body: {
    number: Joi.string().required().length(10),
    bankCode: Joi.string().required(),
  },
};

exports.addNINORPassport = {
  body: {
    type: Joi.string().valid("nin", "passport", "pvc").required(),
    nin: Joi.string(),
    pvcNumber: Joi.string(),
    passportNumber: Joi.string(),
    url: Joi.string().uri(),
  },
};
exports.addBVN = {
  body: {
    bvnNumber: Joi.string().required(),
    address: Joi.string().required(),
    image: Joi.string().required(),
    url: Joi.string().uri(),
  },
};
exports.foreignVerification = {
  body: {
    // email: Joi.string().required(),
    country: Joi.string().required(),
    address: Joi.string().required(),
  },
};
exports.update = {
  body: {
    id: Joi.number().required(),
    bank: Joi.string().required(),
    name: Joi.string().required(),
    number: Joi.string().required(),
  },
};
