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
} = require("../../models");

const {
  successResponse,
  errorResponse,
  uniqueId,
  tx,
  nt,
  // add as addCredit,
  activity_tunnel,
} = require("../../helpers");

const axios = require("axios").default;

const instance = axios.create({
  baseURL: process.env.VERIFY_API_ENDPOINT,
  timeout: 15000,

  headers: {
    Authorization: `Bearer ${process.env.VERIFY_KEY}`,
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

exports.addBVN = async (req, res) => {
  try {
    const { bvnNumber, address, image, url } = req.body;

    // console.log(req.body);

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
      //   .get("v2/api/identity/" + bvnNumber)
      .post("v2/api/identity/ng/bvn", bvnPayload)
      .then(async (bvnInfo) => {
        // console.log(bvnInfo);
        // console.log(bvnInfo);

        if (!bvnInfo) {
          throw new Error("Invalid BVN");
        }
        if (!bvnInfo.data.success) {
          console.log("i am not working ");
          return errorResponse(req, res, err);
        }
        const payload = {
          email: req.user.email,
          bvn_meta: bvnInfo.data.data,
          bvn_number: bvnNumber,
          image,
          address,
          url,
          approved_by: "N/A",
        };

        // console.log("ppoo");
        const BVNData = await BVN.create(payload);

        // console.log("jjjjjj");

        return successResponse(req, res, {
          message: "BVN submitted successfully.",
        });
      })
      .catch((err) => {
        console.log(err);
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

    console.log(bvn);

    let bvnStatus = "N/A";

    if (bvn) {
      bvnStatus = bvn.status;
    }

    return successResponse(req, res, { bvnStatus: bvnStatus });
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};
