const Joi = require("joi");

exports.getOtherUserProfile = {
  body: {
    userId: Joi.number().required(),
  },
};

exports.two2FA = {
  body: {
    token: Joi.string().required(),
  },
};

exports.changePassword = {
  body: {
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().required(),
  },
};

exports.changePin = {
  body: {
    oldPin: Joi.string().required(),
    newPin: Joi.string().required(),
  },
};

exports.AddBeneficiary = {
  body: {
    fullname: Joi.string().required(),
    beneficiary_email: Joi.string().email().required(),
    phone: Joi.string().required(),
    dob: Joi.string().required(),
    relationship: Joi.string().required(),
    state: Joi.string().required(),
    country: Joi.string().required(),
  },
};

exports.resetPin = {
  body: {
    code: Joi.string().required(),
  },
};

exports.register = {
  body: {
    username: Joi.string().required(),
    phone: Joi.string().required(),
    countrycode: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  },
};

exports.swapSignup = {
  body: {
    email: Joi.string().email().required(),
    username: Joi.string().required(),
    password: Joi.string().required(),
  },
};

exports.createActivity = {
  body: {
    message: Joi.string().required(),
    status: Joi.string().required(),
    type: Joi.string().required(),
    tunnel: Joi.string().required(),
  },
};

exports.registerWallet = {
  body: {
    email: Joi.string().email().required(),
    wallet: Joi.string().required(),
  },
};

exports.login = {
  body: {
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  },
};
exports.login2FA = {
  body: {
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    token: Joi.string().required(),
  },
};

exports.resetPassword = {
  body: {
    code: Joi.string().required(),
    newPassword: Joi.string().required(),
  },
};

exports.resetLink = {
  body: {
    email: Joi.string().email().required(),
  },
};

exports.verify = {
  body: {
    code: Joi.string().min(4).required(),
  },
};

exports.verifyEmail = {
  body: {
    code: Joi.string().required(),
  },
};

exports.smsResend = {
  body: {
    // phone: Joi.string().required(),
    // countrycode: Joi.string().required(),
    email: Joi.string().required(),
  },
};

exports.emailResend = {
  body: {
    email: Joi.string().required(),
  },
};
