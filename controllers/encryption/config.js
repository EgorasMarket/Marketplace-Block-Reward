const dotenv = require("dotenv").config();

const { ENC_SECRET_KEY, ENC_SECRET_IV, ENC_METHOD } = process.env;

module.exports = {
  secret_key: ENC_SECRET_KEY,
  secret_iv: ENC_SECRET_IV,
  ecnryption_method: ENC_METHOD,
};
