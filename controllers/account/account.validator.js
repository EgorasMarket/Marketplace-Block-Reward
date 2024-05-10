const Joi = require("joi");

export const verifyBVNorNIN = {
  body: {
    type: Joi.string().required(),
    code: Joi.string().required(),
  },
};
export const add = {
  body: {
    bank: Joi.string().required(),
    name: Joi.string().required(),
    number: Joi.string().required(),
  },
};

export const verify = {
  body: {
    nin: Joi.string().required(),
    dob: Joi.string().required(),
  },
};
export const DeleteBank = {
  body: {
    id: Joi.string().required(),
  },
};

export const addBank = {
  body: {
    bank_name: Joi.string().required(),
    bank_code: Joi.string().required(),
  },
};

export const getAccountInfo = {
  body: {
    number: Joi.string().required().length(10),
    bankCode: Joi.string().required(),
  },
};

export const addNINORPassport = {
  body: {
    type: Joi.string().valid("nin", "passport", "pvc").required(),
    nin: Joi.string(),
    pvcNumber: Joi.string(),
    passportNumber: Joi.string(),
    url: Joi.string().uri(),
  },
};
export const addBVN = {
  body: {
    bvnNumber: Joi.string().required(),
    address: Joi.string().required(),
    image: Joi.string().required(),
    url: Joi.string().uri(),
  },
};
export const foreignVerification = {
  body: {
    // email: Joi.string().required(),
    country: Joi.string().required(),
    address: Joi.string().required(),
  },
};
export const update = {
  body: {
    id: Joi.number().required(),
    bank: Joi.string().required(),
    name: Joi.string().required(),
    number: Joi.string().required(),
  },
};
