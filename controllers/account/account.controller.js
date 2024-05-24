const {
  Account,
  NIN,
  Bank,
  Notification,
  Devices,
  Watu,
  Deposit,
  ManualNIN,
  BVN,
  ForeignVerification,
  KYC,
  virtual_banks,
} = require("../../models");
const { sendTemplate } = require("../../helpers/utils");

const {
  successResponse,
  errorResponse,
  uniqueId,
  tx,
  nt,
  add: addCredit,
  activity_tunnel,
} = require("../../helpers");
const crypto = require("crypto");

const Flutterwave = require("flutterwave-node-v3");
const axios = require("axios").default;

const { Op } = require("sequelize");
const db = require("../../config/sequelize");
const { resolveInclude } = require("ejs");

const instance = axios.create({
  baseURL: process.env.VERIFY_API_ENDPOINT,
  timeout: 15000,

  headers: {
    Authorization: `Bearer ${process.env.VERIFY_KEY}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const watuAccount = axios.create({
  baseURL: process.env.WATU_BASE_URL,
  timeout: 15000,

  headers: {
    Authorization: `Bearer ${process.env.WATU_SECRET_KEY}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const you_verify_instance = axios.create({
  // baseURL: process.env.YOU_VERIFY_TESTNET_ENDPOINT,
  baseURL: process.env.YOU_VERIFY_MAINNET_ENDPOINT,
  timeout: 15000,
  headers: {
    // token: process.env.YOU_VERIFY_API_KEY,
    token: process.env.YOU_VERIFY_LIVE_API_KEY,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const accountInstance = axios.create({
  baseURL: process.env.MONNIFY_API_ENDPOINT,
  timeout: 15000,

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization:
      "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
  },
});


exports.flutterwaveHooksOLD = async (req, res) => {
  try {
    const payload = req.body;
    // console.log(payload);
    const flw = new Flutterwave(
      process.env.FLW_PUBLIC_KEY,
      process.env.FLW_SECRET_KEY
    );
    const response = await flw.Transaction.verify({ id: payload.data.id });

    if (
      !response.data.status === "successful" &&
      !response.data.currency === "NGN"
    ) {
      throw new Error("Verification Failed");
    }

    await db.sequelize.transaction(async (flwHooks) => {
      const amount = parseFloat(response.data.amount);
      const addFund = await addCredit(
        payload.data.customer.email,
        "NGN",
        "portfolio",
        "value",
        amount,
        flwHooks
      );
      const ntPayload = {
        email: payload.data.customer.email,
        meta: {
          symbol: "NGN",
          amount: amount.toString(),
          type: "deposit",
        },
      };

      const createNt = await nt(ntPayload, flwHooks);
      const txPayload = {
        email: payload.data.customer.email,
        to_email: payload.data.customer.email,
        meta: {
          symbol: "NGN",
          txh: payload.data.flwRef,
          confirmation: "3/3",
          network: "Flutterwave",
          wallet_address: "n/a",
        },

        amount,
        type: "DEPOSIT",
        status: "SUCCESS",
      };

      const createTx = await tx(txPayload, flwHooks);

      if (!addFund[0][1] && !createNt[0][1] && !createTx[0][1]) {
        throw new Error("Failed");
      }
      // return successResponse(req, res, {});
    });
    return successResponse(req, res, {});
  } catch (error) {
    console.log(error);
    return errorResponse(req, res, error.message);
  }
};

exports.verifyBVNorNIN = async (req, res) => {
  try {
    const { type, code } = req.body;
    const channel = type === "bvn" ? "bvn-data" : "nin";
    const payload = {
      channel,
      bvn: code,
      nin: code,
    };
    const { firstName, lastName, email } = req.user;

    const checkNIN = await NIN.findOne({
      where: { email },
    });

    if (checkNIN) {
      if (checkNIN.status === "PENDING") {
        throw new Error("Verification is in progress.");
      } else if (checkNIN.status === "'VERIFIED") {
        throw new Error("Account already verified.");
      } else if (checkNIN.status === "'REJECTED") {
        throw new Error(
          "Account already was rejected. Please contact support."
        );
      }
    }

    const result = await watuAccount.post("verify", payload);
    const bvnName = `${result.data.data.first_name} ${result.data.data.last_name} ${result.data.data.middle_name}`;

    if (
      bvnName.toLocaleLowerCase().includes(firstName.toLocaleLowerCase()) &&
      bvnName.toLocaleLowerCase().includes(lastName.toLocaleLowerCase())
    ) {
      const payload2 = {
        email,
        status: "VERIFIED",
        meta: result.data.data,
        verifiedBy: "N/A",
      };

      await NIN.create(payload2);
      return successResponse(req, res, {});
    }
    return errorResponse(req, res, "BVN name mismatch!");
  } catch (error) {
    if (typeof error.response !== "undefined") {
      return errorResponse(
        req,
        res,
        "Verification server error. Try again later!"
      );
    }
    return errorResponse(req, res, error.message);
  }
};


exports.getNumber = async (req, res) => {
  try {
    const numbers = [];

    req.body.data.forEach((element) => {
      const string = element.debioNumbers.split(",");
      string.forEach((elem) => {
        // console.log(elem);
        numbers.push(elem);
      });
    });
    return successResponse(req, res, { numbers });
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};


exports.verify_payout_details = async function (req, res) {
  try {
    const { bank_code, account } = req.params;
    console.log(req.params, "danladi");

    const details = await axios.post(
      "https://api.korapay.com/merchant/api/v1/misc/banks/resolve",
      { bank: bank_code, account }
    );

    console.log(details.data);

    return successResponse(req, res, details.data.data);
  } catch (error) {
    console.log(error.response || error.message);
    return errorResponse(req, res, error.message);
  }
};

exports.sendBVNVerification = async (req, res) => {
  try {
    const limit = parseInt(req.params.limit);
    const getManualKYCInformation = await ManualNIN.findAndCountAll({
      where: {
        status: "PENDING",
      },
      limit,
    });

    if (getManualKYCInformation.count === 0) {
      return errorResponse(req, res, "No Record");
    }

    getManualKYCInformation.rows.forEach((value, index) => {
      // console.log('Index: ' + index + ' Value: ' + value.bvn);
      const bvnPayload = {
        id: value.bvn,
        isSubjectConsent: true,
      };

      you_verify_instance
        .post("v2/api/identity/ng/bvn", bvnPayload)
        .then(async (bvnInfo) => {
          await ManualNIN.update(
            {
              bvn_meta: bvnInfo.data.data,
              nin_meta: {},
              status: "AWAITING APPROVAL",
            },
            { where: { id: value.id } }
          );
          return successResponse(req, res, {});
        })
        .catch((err) => {
          console.log(err.response, "err");
          return errorResponse(req, res, err);
        });
    });
  } catch (error) {
    console.log(error);
    return errorResponse(req, res, error.message);
  }
};

exports.addNINOrPassportNumber = async (req, res) => {
  try {
    const { type, nin, pvcNumber, passportNumber } = req.body;

    const ninPayload = {
      id: nin,
      isSubjectConsent: true,
    };
    const pvcPayload = {
      id: pvcNumber,
      metadata: {
        requestId: uniqueId(16),
      },
      isSubjectConsent: true,
    };
    const passportPayload = {
      id: passportNumber,
      metadata: {
        requestId: uniqueId(16),
      },
      lastName: req.user.lastName,
      isSubjectConsent: true,
    };

    const check = await NIN.findOne({
      where: { email: req.user.email, type: type.toUpperCase() },
    });

    if (check && check.status === "APPROVED") {
      throw new Error("Document already verified");
    }

    if (check && check.status !== "APPROVED") {
      throw new Error(
        `Verification in progress. current verification status: ${check.status}!`
      );
    }

    if (type === "nin") {
      you_verify_instance
        .post("v2/api/identity/ng/nin", ninPayload)
        .then(async (ninInfo) => {
          if (!ninInfo) {
            throw new Error("Invalid Data");
          }
          if (ninInfo.data.success === true) {
            const payload = {
              email: req.user.email,
              type: type.toUpperCase(),
              nin_number: nin,
              meta_data: ninInfo.data.data,
              approved_by: "N/A",
            };

            const verificationData = await NIN.create(payload);

            if (verificationData) {
              await KYC.create({
                email: req.user.email,
                type: "NIN",
                level: "LEVEL_3",
                status: "NOT_VERIFIED",
              });
            }
            return successResponse(req, res, {
              message: "Verification data submitted successfully.",
            });
          }
          return successResponse(req, res, {});
        })
        .catch((err) => errorResponse(req, res, err));
    }
    if (type === "pvc") {
      you_verify_instance
        .post("v2/api/identity/ng/pvc", pvcPayload)
        .then(async (pvcInfo) => {
          if (!pvcInfo) {
            throw new Error("Invalid Data");
          }
          if (pvcInfo.data.success === true) {
            const payload = {
              email: req.user.email,
              type: type.toUpperCase(),
              pvc_number: pvcNumber,
              meta_data: pvcInfo.data.data,
              approved_by: "N/A",
            };

            const verificationData = await NIN.create(payload);

            if (verificationData) {
              await KYC.create({
                email: req.user.email,
                type: "VOTERS_CARD",
                level: "LEVEL_3",
                status: "NOT_VERIFIED",
              });
            }
            return successResponse(req, res, {
              message: "Verification data submitted successfully.",
            });
          }
          return successResponse(req, res, {});
        })
        .catch((err) => errorResponse(req, res, err));
    }
    if (type === "passport") {
      you_verify_instance
        .post("v2/api/identity/ng/passport", passportPayload)
        .then(async (passportInfo) => {
          if (!passportInfo) {
            throw new Error("Invalid Data");
          }
          if (passportInfo.data.success === true) {
            const payload = {
              email: req.user.email,
              type: type.toUpperCase(),
              passport_number: passportNumber,
              meta_data: passportInfo.data.data,
              approved_by: "N/A",
            };

            const verificationData = await NIN.create(payload);

            if (verificationData) {
              await KYC.create({
                email: req.user.email,
                type: "INTERNATIONAL_PASSPORT",
                level: "LEVEL_3",
                status: "NOT_VERIFIED",
              });
            }
            return successResponse(req, res, {
              message: "Verification data submitted successfully.",
            });
          }
          return successResponse(req, res, {});
        })
        .catch((err) => {
          console.log(err);
          errorResponse(req, res, err);
        });
    }
  } catch (error) {
    console.log(error);
    return errorResponse(req, res, error.message);
  }
};

exports.getUserKYCStatus = async (req, res) => {
  try {
    console.log(req.user.email);

    const check = await KYC.findAll({
      where: { email: req.user.email },
    });

    console.log(check.length, "ppppp");
    let finalLevel = "LEVEL_0";
    let finalStatus = "LEVEL_0";
    let finalType = "LEVEL_0";

    if (check.length === 0) {
      console.log("0000000");

      finalLevel = "LEVEL_1";
      finalStatus = "NOT_VERIFIED";
      // if (bvnArray[0].dataValues.status == "VERIFIED") {
      // }
    }

    if (check.length === 1) {
      console.log("111");
      const bvnArray = check.filter((item) => item.type == "EMAIL");

      console.log(bvnArray[0].dataValues.status);
      finalStatus = bvnArray[0].dataValues.status;
      finalLevel = bvnArray[0].dataValues.level;
      finalType = bvnArray[0].dataValues.type;
      // if (bvnArray[0].dataValues.status == "VERIFIED") {
      // }
    }

    if (check.length === 2) {
      console.log("222");

      const bvnArray = check.filter((item) => item.type == "BVN");

      console.log(bvnArray[0].dataValues.status);
      finalStatus = bvnArray[0].dataValues.status;
      finalLevel = bvnArray[0].dataValues.level;
      finalType = bvnArray[0].dataValues.type;

      // if (bvnArray[0].dataValues.status == "VERIFIED") {
      // }
      // else {
      //   finalLevel = "LEVEL_1";
      // }
    }

    if (check.length === 3) {
      console.log("333");

      const bvnArray = check.filter(
        (item) =>
          item.type === "NIN" ||
          item.type === "VOTERS_CARD" ||
          item.type === "INTERNATIONAL_PASSPORT" ||
          item.type === "DRIVERS_LICENSE" ||
          item.type === "FOREIGN"
      );

      const foreignArray = check.filter((item) => item.type === "FOREIGN");

      // console.log(foreignArray.length);
      finalStatus = bvnArray[0].dataValues.status;

      if (foreignArray.length == 2) {
        finalLevel = "LEVEL_3";
        finalType = bvnArray[0].dataValues.type;
      } else {
        finalLevel = bvnArray[0].dataValues.level;
        finalType = bvnArray[0].dataValues.type;
      }

      // console.log(bvnArray[0].dataValues.status);

      // if (bvnArray[0].dataValues.status == "VERIFIED") {
      // }
      // else {
      //   finalLevel = "LEVEL_2";
      // }
    }

    return successResponse(req, res, {
      data: {
        level: finalLevel,
        status: finalStatus,
        type: finalType,
      },
    });
  } catch (error) {
    console.log(error);
    return errorResponse(req, res, error.message);
  }
};

exports.getMyNIN = async (req, res) => {
  try {
    const manualNIN = await ManualNIN.findOne({
      where: { email: req.user.email },
    });

    return successResponse(req, res, { manualNIN });
  } catch (error) {
    console.log(error.response);
    return errorResponse(req, res, error.message);
  }
};
exports.getNIN = async (req, res) => {
  try {
    const checkNIN = await NIN.findOne({
      where: { email: req.user.email },
    });
    return successResponse(req, res, checkNIN);
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};
exports.verifyAccountByNIN = async (req, res) => {
  try {
    const { nin, dob } = req.body;
    const { firstName, lastName, email } = req.user;
    const payload = {
      firstname: firstName,
      lastname: lastName,
      dob,
    };

    const checkNIN = await NIN.findOne({
      where: { email },
    });
    if (checkNIN) {
      if (checkNIN.status === "PENDING") {
        throw new Error("Verification is in progress.");
      } else if (checkNIN.status === "'VERIFIED") {
        throw new Error("Account already verified.");
      } else if (checkNIN.status === "'REJECTED") {
        throw new Error(
          "Account already was rejected. Please contact support."
        );
      }
    }

    const result = await instance.post(`nin/${nin}`, payload);
    if (result.data.status === "success") {
      const payload = {
        email,
        status: "PENDING",
        meta: result.data.data,
        verifiedBy: "N/A",
      };

      await NIN.create(payload);
    } else {
      throw new Error("Verification failed! Please enter a valid NIN");
    }

    return successResponse(req, res, {});
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

exports.addBVN = async (req, res) => {
  try {
    const { bvnNumber, address, image, url, firstName, lastName } = req.body;

    const checkBVN = await BVN.findOne({
      where: { email: req.user.email },
    });

    if (checkBVN) {
      throw new Error(
        `BVN already submitted. current verification status: ${checkBVN.status}!`
      );
    }

    const bvnPayload = {
      id: bvnNumber,
      isSubjectConsent: true,
    };

    you_verify_instance
      .post("v2/api/identity/ng/bvn", bvnPayload)
      .then(async (bvnInfo) => {
        // console.log(bvnInfo);
        // console.log(bvnInfo);
        if (!bvnInfo) {
          throw new Error("Invalid BVN");
        }
        if (bvnInfo.data.success === true) {
          const payload = {
            email: req.user.email,
            bvn_meta: bvnInfo.data.data,
            bvn_number: bvnNumber,
            image,
            address,
            url,
            approved_by: "N/A",
          };

          const BVNData = await BVN.create(payload);

          if (BVNData) {
            await KYC.create({
              email: req.user.email,
              type: "BVN",
              level: "LEVEL_2",
              status: "NOT_VERIFIED",
            });

            const notification_payload = {
              tunnel: activity_tunnel.admin,
              email: req.user.email,
              meta: {
                bvn_meta: bvnInfo.data.data,
                bvn_number: bvnNumber,
                image,
                address,
                url,
                approved_by: "N/A",
                type: "verification",
              },
            };
            await nt(notification_payload, t);
          }
          return successResponse(req, res, {
            message: "BVN submitted successfully.",
          });
        }
        return successResponse(req, res, {});
      })
      .catch((err) => {
        // console.log(err);
        errorResponse(req, res, err);
      });
  } catch (error) {
    console.log(error);
    return errorResponse(req, res, error.message);
  }
};

exports.getMyBVN = async (req, res) => {
  try {
    const bvn = await BVN.findOne({
      where: { email: req.user.email },
    });

    return successResponse(req, res, { BVN: bvn.bvnNumber });
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

exports.DeleteBank = async (req, res) => {
  try {
    const bank = await Account.findOne({
      where: { email: req.user.email, id: req.body.id },
    });

    if (bank) {
      await Account.destroy({
        where: { email: req.user.email, id: req.body.id },
      });
    } else {
      throw new Error("No bank account to delete.");
    }

    return successResponse(req, res, {});
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};


exports.add = async (req, res) => {
  try {
    const { number, name, bank } = req.body;

    const account = await Account.findOne({
      where: {
        number,
        bank,
        name,
        email: req.user.email,
      },
    });
    if (account) {
      throw new Error("Already added");
    }

    const payload = {
      number,
      name,
      bank,
      email: req.user.email,
    };

    const newAccount = await Account.create(payload);
    return successResponse(req, res, { newAccount });
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

exports.foreignVerification = async (req, res) => {
  try {
    const { country, address } = req.body;

    console.log(req.user);

    const checkBVN = await ForeignVerification.findOne({
      where: { email: req.user.email },
    });

    if (checkBVN) {
      throw new Error(
        `Verification process in motion. current verification status: ${checkBVN.status}!`
      );
    }

    const payload = {
      country,
      address,
      // email: req.user.email,
      email: req.user.email,
    };

    const newAccount = await ForeignVerification.create(payload);

    if (newAccount) {
      const ddd = await KYC.create({
        email: req.user.email,
        type: "FOREIGN",
        level: "LEVEL_2",
        status: "NOT_VERIFIED",
      });
      // console.log(ddd);
      let dynamic_template_data = {
        country: country,
        email: req.user.email,
        subject: "International Verification Request Alert",
        name: `${req.user.firstName}, ${req.user.lastName}`,
      };

      sendTemplate(
        "121ebrinix@gmail.com",
        process.env.FROM,
        process.env.FOREIGN_KYC_REQUEST,
        dynamic_template_data
      );
      sendTemplate(
        "fortagip@gmail.com",
        process.env.FROM,
        process.env.FOREIGN_KYC_REQUEST,
        dynamic_template_data
      );
    }

    return successResponse(req, res, { newAccount });
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

exports.foreignKycCallback = async (req, res) => {
  try {
    const { user_id } = req.body;

    const checkBVN = await ForeignVerification.findOne({
      where: { id: user_id },
    });

    if (!checkBVN) {
      throw new Error(`User does not exist`);
    }

    let job_userId = user_id;

    let timestamp = new Date().toISOString();
    let api_key = process.env.SMILE_API_KEY;
    let partner_id = process.env.SMILE_PARTNER_ID;
    let hmac = crypto.createHmac("sha256", api_key);

    hmac.update(timestamp, "utf8");
    hmac.update(partner_id, "utf8");
    hmac.update("sid_request", "utf8");

    let signature = hmac.digest().toString("base64");

    let getJobId = {
      timestamp: timestamp,
      signature: signature,
      user_id: job_userId,
      partner_id: process.env.SMILE_PARTNER_ID,
      environment: "production",
    };

    let jobIdCall = await axios.post(
      "https://prod.smileidentity.com/api/v2/partner/enrollee/info",
      getJobId
    );

    console.log(jobIdCall.data.history[0].partner_params.job_id);

    if (jobIdCall.data.history[0].partner_params.job_id) {
      let jobStatus = {
        timestamp: timestamp,
        signature: signature,
        user_id: job_userId,
        job_id: jobIdCall.data.history[0].partner_params.job_id,
        partner_id: "6477",
        image_links: true,
        history: true,
      };

      let jobStatusCall = await axios.post(
        "https://api.smileidentity.com/v1/job_status",
        jobStatus
      );

      console.log(jobStatusCall.data.result);

      const payload = {
        kyc_meta: jobStatusCall.data.result,
      };

      let ddds = await ForeignVerification.update(payload, {
        where: { id: user_id },
      });

      console.log(ddds);
    }

    return successResponse(req, res, {});
  } catch (error) {
    console.log(error);
    return errorResponse(req, res, error.message);
  }
};

exports.checkForeignKyc = async (req, res) => {
  try {
    const { email } = req.user;

    const checkBVN = await ForeignVerification.findOne({
      where: { email },
    });

    let kycStatus = "";

    if (!checkBVN) {
      kycStatus = "NEW";
    } else {
      kycStatus = checkBVN.status;
    }

    return successResponse(req, res, { status: kycStatus });
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

exports.update = async (req, res) => {
  try {
    const { number, name, bank, id } = req.body;

    const account = await Account.findOne({
      where: { email: req.user.email, id },
    });
    if (!account) {
      throw new Error("Account does not exist.");
    }

    const payload = {
      number,
      name,
      bank,
      email: req.user.email,
    };

    await Account.update(payload, { where: { email: req.user.email, id } });
    return successResponse(req, res, { newAccount: payload });
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

exports.get = async (req, res) => {
  try {
    const page = req.params.page > 0 ? req.params.page : 1;
    const limit = parseInt(req.params.limit);
    const accounts = await Account.findAndCountAll({
      order: [
        ["createdAt", "DESC"],
        ["name", "ASC"],
      ],
      offset: (page - 1) * limit,
      limit,
      where: { deleted: null, email: req.user.email },
    });

    return successResponse(req, res, { accounts });
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

exports.getAll = async (req, res) => {
  try {
    const page = req.params.page > 0 ? req.params.page : 1;
    const limit = parseInt(req.params.limit);
    const accounts = await Account.findAndCountAll({
      order: [
        ["createdAt", "DESC"],
        ["name", "ASC"],
      ],
      offset: (page - 1) * limit,
      limit,
      where: { deleted: null },
    });

    return successResponse(req, res, { accounts });
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

exports.getAllBanks = async (req, res) => {
  try {
    const page = req.params.page > 0 ? req.params.page : 1;
    const limit = parseInt(req.params.limit);
    const banks = await Bank.findAndCountAll({
      order: [
        ["bank_name", "ASC"],
        ["createdAt", "DESC"],
      ],
      offset: (page - 1) * limit,
      limit,
    });

    return successResponse(req, res, banks);
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

exports.getDevices = async (req, res) => {
  try {
    const page = req.params.page > 0 ? req.params.page : 1;
    const limit = parseInt(req.params.limit);
    const devices = await Devices.findAndCountAll({
      order: [["createdAt", "DESC"]],
      offset: (page - 1) * limit,
      limit,
      where: { email: req.user.email },
    });

    return successResponse(req, res, devices);
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const page = req.params.page > 0 ? req.params.page : 1;
    const limit = parseInt(req.params.limit);
    const offset = (page - 1) * limit;
    const user = req.user.email;
    const query = `call sp_getNotifications('${user}', ${offset}, ${limit})`;
    const result = await db.sequelize.query(query);

    return successResponse(req, res, result);
  } catch (error) {
    return errorResponse(req, res, error.message);
    // h
  }
};
