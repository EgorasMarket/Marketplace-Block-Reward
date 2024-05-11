require("dotenv").config();
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { Op } = require("sequelize");
const { v4 } = require("uuid");
const uuidv4 = v4;

const {
  User,
  userActivity,
  ReferralCode,
  ReferralList,
} = require("../../models");

const {
  successResponse,
  errorResponse,
  activity_status,
  activity_tunnel,
} = require("../../helpers");

const bcrypt = require("bcrypt");
const speakeasy = require("speakeasy");
const db = require("../../config/sequelize");
const { sendTemplate } = require("../../helpers/utils");
const axiosCustom = require("axios").default;

const instance = axiosCustom.create({
  baseURL: process.env.BLOCKCHAIN_ENDPOINT,
  timeout: 15000,

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

exports.newActivity = async ({
  user_email,
  message,
  status,
  type = activity_tunnel.user,
  tunnel,
}) => {
  try {
    await userActivity.create({
      user_email,
      message,
      status,
      call_type: type,
      tunnel,
    });

    return {
      success: true,
      message: "successful",
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

exports.registerWallet = async (req, res) => {
  let t;

  try {
    t = await db.sequelize.transaction();
    const { email, wallet } = req.body;

    const user = await User.scope("withSecretColumns").findOne({
      where: { email },
    });
    if (!user) {
      throw new Error("User does not exists with same email");
    }

    const updateWallet = await User.update(
      { wallet_address: wallet },
      { where: { email } }
    );
    // console.log(updateTransaction[0]); //FAILED
    if (!updateWallet[0]) {
      throw new Error("Unable to add user wallet!");
    }

    //  const newUser = await User.create(payload, {transaction: t});
    // if (newUser) {
    //   var dynamic_template_data = {
    //     "code": rCode,
    //     "subject": "Egoras Email Verification",
    //     "name": payload.firstName + ", " + payload.lastName
    //   }
    // sendTemplate(payload.email,process.env.FROM, process.env.EMAILVERIFICATION_TEMPLATE_ID, dynamic_template_data)
    await t.commit();
    return successResponse(req, res, {});
  } catch (error) {
    await t.rollback();
    return errorResponse(req, res, error.message);
  }
};

exports.register = async (req, res) => {
  let t;
  const sender_id = process.env.TERMII_SEC_KEY;
  const api_key = process.env.TERMII_API_KEY;

  const emailId = uuidv4();

  try {
    t = await db.sequelize.transaction();
    const { email, password, username, phone, countrycode } = req.body;

    if (process.env.IS_GOOGLE_AUTH_ENABLE === "true") {
      if (!req.body.code) {
        throw new Error("code must be defined");
      }
      const { code } = req.body;
      const customUrl = `${process.env.GOOGLE_CAPTCHA_URL}?secret=${process.env.GOOGLE_CAPTCHA_SECRET_SERVER}&response=${code}`;
      const response = await axios({
        method: "post",
        url: customUrl,
        data: {
          secret: process.env.GOOGLE_CAPTCHA_SECRET_SERVER,
          response: code,
        },
        config: { headers: { "Content-Type": "multipart/form-data" } },
      });
      if (!(response && response.data && response.data.success === true)) {
        throw new Error("Google captcha is not valid");
      }
    }

    const user = await User.scope("withSecretColumns").findOne({
      where: { email },
    });

    const userUsername = await User.scope("withSecretColumns").findOne({
      where: { username },
    });

    const userPhone = await User.scope("withSecretColumns").findOne({
      where: { phone },
    });

    if (user) {
      await this.newActivity({
        user_email: email,
        message: "Tried to Create another account with same email",
        status: activity_status.failure,
        tunnel: activity_tunnel.user,
        type: "Authentication",
      });
      throw new Error("User already exists with same email");
    }
    if (userUsername) {
      await this.newActivity({
        user_email: email,
        message: ` ${email} attempted signing up with username: ${username} that is already in use`,
        status: activity_status.failure,
        tunnel: activity_tunnel.user,
        type: "Authentication",
      });
      throw new Error("User already exists with same username");
    }
    if (userPhone) {
      await this.newActivity({
        user_email: email,
        message: ` ${email} attempted signing up with phone Number: ${phone} that is already in use`,
        status: activity_status.failure,
        tunnel: activity_tunnel.user,
        type: "Authentication",
      });
      throw new Error("User already exists with same phone number");
    }

    const salt = await bcrypt.genSalt(parseInt(process.env.SALTROUNDS));
    const reqPass = bcrypt.hashSync(password, parseInt(salt));
    const rCode = Math.floor(1000 + Math.random() * 9000);
    let smsCode = "";

    const characterToRemove = "+";

    // Split the string into an array of characters, filter out the character to remove, and join them back into a string
    const subCode = countrycode
      .split("")
      .filter((char) => char !== characterToRemove)
      .join("");

    let standardFormat = "";

    if (phone.startsWith("0")) {
      standardFormat = phone.slice(1);
    } else {
      standardFormat = phone;
    }

    const smsOtp = {
      api_key,
      message_type: "NUMERIC",
      to: subCode + standardFormat,
      from: "N-Alert",
      channel: "dnd",
      pin_attempts: 10,
      pin_time_to_live: 5,
      pin_length: 6,
      // OPT is Generated From Termii
      pin_placeholder: "< 000000 >",
      message_text: `Hi ${email} < 000000 > is your verification code Egoras Technologies Limited.`,
      // END

      pin_type: "NUMERIC",
    };

    if (countrycode == "+234") {
      const response = await axios({
        method: "post",
        url: "https://api.ng.termii.com/api/sms/otp/send",
        data: smsOtp,
        config: {
          headers: {
            "Content-Type": ["application/json", "application/json"],
          },
        },
      });

      console.log(response);

      smsCode = response.data.pinId;
    }

    const payload = {
      email,
      username,
      phone,
      countrycode,
      emailId,
      password: reqPass,
      isVerified: countrycode == "+234" ? false : true,
      // verifyToken: rCode,
      smsOtp: smsCode,
    };

    const newUser = await User.create(payload, { transaction: t });
    // add Referral
    if (req.body.referral != undefined && req.body.referral != "") {
      const checkReferralCode = await ReferralCode.findOne({
        where: { referral },
      });
      if (checkReferralCode) {
        await ReferralList.create(
          { referred: checkReferralCode.user, email: email },
          { transaction: t }
        );
      }
    }
    // end of add referral
    if (newUser) {
      await this.newActivity({
        user_email: email,
        message: ` ${email} have successfully Signed Up`,
        status: activity_status.success,
        tunnel: activity_tunnel.user,
        type: "Registration",
      });
      await t.commit();
      return successResponse(req, res, {});
    }
  } catch (error) {
    console.log(error);
    await t.rollback();
    return errorResponse(req, res, error.message);
  }
};

exports.login = async (req, res) => {
  try {
    const host = req.get("host");

    const user = await User.scope("withSecretColumns").findOne({
      where: { email: req.body.email },
    });
    if (!user) {
      await this.newActivity({
        user_email: req.body.email,
        message: "Failed Login Attempt: Reason: Incorrect Email Id/Password",
        status: activity_status.failure,
        tunnel: activity_tunnel.user,
        type: "Authentication",
      });
      throw new Error("Incorrect Email Id/Password");
    }
    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) {
      await this.newActivity({
        user_email: req.body.email,
        message: "Failed Login Attempt: Reason: Incorrect password",
        status: activity_status.failure,
        tunnel: activity_tunnel.user,
        type: "Authentication",
      });
      throw new Error("Incorrect Email Id/Password");
    }

    // const payload = {
    //   email: req.body.email,
    //   meta: {
    //     brand: req.body.brand,
    //     model: req.body.model,
    //     ipv4: req.body.ipv4,
    //   },
    // };
    // await Devices.create(payload);

    if (!user.isVerified) {
      await this.newActivity({
        user_email: req.body.email,
        message: `Failed Login Attempt. Reason: ${req.body.email} have not verified phone number `,
        status: activity_status.failure,
        tunnel: activity_tunnel.user,
        type: "Authentication",
      });
      throw new Error("VERIFICATION_REQUIRED");
    }

    if (host !== "") {
      if (user.has2fa && user.user_pin != null) {
        await this.newActivity({
          user_email: req.body.email,
          message: `Failed Login Attempt. Reason:  2FA is required `,
          status: activity_status.failure,
          tunnel: activity_tunnel.user,
          type: "Authentication",
        });
        throw new Errv3() - staging.egoras.orgor("2FA_REQUIRED");
      }
    }

    const token = jwt.sign(
      {
        user: {
          userId: user.id,
          email: user.email,
          createdAt: new Date(),
        },
      },
      process.env.SECRET
    );
    delete user.dataValues.password;
    await this.newActivity({
      user_email: req.body.email,
      message: `Successful Login attempt `,
      status: activity_status.success,
      tunnel: activity_tunnel.user,
      type: "Authentication",
    });

    return successResponse(req, res, { user, token });
  } catch (error) {
    await this.newActivity({
      user_email: req.body.email,
      message: `Failed Login Attempt. Reason: ${error.message}`,

      status: activity_status.failure,
      tunnel: activity_tunnel.user,
      type: "Authentication",
    });
    return errorResponse(req, res, error.message);
  }
};
