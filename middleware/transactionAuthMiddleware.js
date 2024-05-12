const { errorResponse } = require("../helpers");
const { User, Twofa } = require("../models");
const bcrypt = require("bcrypt");

const speakeasy = require("speakeasy");

const transactionAuthMiddleware = async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: { email: req.user.email },
    });
    if (!user) {
      throw new Error(" Invalid  Account");
    }

    if (user.has2fa) {
      const twofa = await Twofa.findOne({
        where: { email: req.user.email },
      });
      if (!twofa) {
        throw new Error("Please this account does not have 2FA!");
      }
      var parsed = JSON.parse(twofa.code);

      var verified = speakeasy.totp.verify({
        secret: parsed.ascii,
        encoding: "ascii",
        token: req.body.pin_code,
      });

      if (!verified) {
        throw new Error("Invalid token.");
      }
    } else {
      const match = await bcrypt.compare(req.body.pin_code, user.user_pin);
      if (!match) {
        throw new Error("pin is incorrect");
      }
    }
    return next();
  } catch (error) {
    console.log(error);
    return errorResponse(req, res, "Please enter a valid pin", 401);
  }
};

// export default transactionAuthMiddleware;
module.exports = transactionAuthMiddleware;
