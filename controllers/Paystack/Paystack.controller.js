const { successResponse, errorResponse } = require("../../helpers");
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
  TestHook,
  virtual_banks,
} = require("../../models");
const mockSuccess = require("./virtual-account-success.json");
// import Paystack from "./PaystackInstance";
const Paystack = require("./PaystackInstance");
exports.generateVirtualAccount = async (req, res) => {
  try {
    const { email, firstName, lastName, phone } = req.user;

    //create a customer

    const customer = await Paystack.post("/customer", {
      email,
      first_name: firstName,
      last_name: lastName,
      phone,
    });

    // const createVirtualAccount = await Paystack.post("/dedicated_account", {
    //   customer: customer.data,
    // });
    let success = mockSuccess;
    if (success) {
      console.log(success);

      //check if data already exist
      const isDetailsExist = await virtual_banks.findOne({
        where: {
          email,
        },
      });

      if (!isDetailsExist) {
        //add this data to the table

        const payload = {
          account_id: success.data.account_number,
          account_name: success.data.account_name,
          email,
          bank: JSON.stringify(success.data.bank),
          integration: "PAYSTACK",
        };

        //save to the data

        const savedData = await virtual_banks.create(payload);
      }
    }

    return successResponse(req, res, { customer: success });
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};
