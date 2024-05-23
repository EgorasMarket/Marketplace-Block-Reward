require("dotenv").config();
const axios = require("axios").default;

const baseURL = "https://api.paystack.co";

const Paystack = axios.create({
  baseURL,
  headers: {
    authorization: `Bearer ${process.env.PAYSTACK_SECRET_LIVE}`,
    "content-type": "application/json",
    Accept: "application/json",
  },
});

module.exports = Paystack;
