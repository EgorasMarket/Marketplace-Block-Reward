const sgMail = require("@sendgrid/mail");
const axios = require("axios");

const sgMailApiKey = process.env.SENDGRID_API_KEY;

sgMail.setApiKey(sgMailApiKey);
exports.sendTemplate = (
  to,
  from,
  templateId,
  dynamic_template_data,
  name = "Egoras"
) => {
  try {
    const msg = {
      to,
      from: { name, email: from },
      templateId,
      dynamic_template_data,
    };
    sgMail
      .send(msg)
      .then((response) => {
        console.log(response, "jjjjj");
      })
      .catch((error) => {
        console.log(JSON.stringify(error.response), "XXXXXX");
        //throw new Error('User already exists with same email');
      });
  } catch (error) {}
};
exports.sendTemplateAlt = async ({ subject, name = "Egoras", message }) => {
  try {
    const payload = {
      subject,
      message,
    };
    try {
      const result = await axios.post(
        "https://sender.egoras.com/send-grid/payment-request",
        payload
      );
      return result.data;
    } catch (error) {
      console.log(error);
      return false;
    }
  } catch (error) {}
};

module.exports.checkPrefix = (network, search) => {
  try {
    switch (network.toLowerCase()) {
      case "mtn":
        const prefixesMTN = [
          "0803",
          "0806",
          // "0806",
          "0703",
          "0706",
          "0813",
          "0816",
          "0810",
          "0814",
          "0903",
          "0906",
          "0913",
          "0916",
          "07025",
          "07026",
          "0704",
        ];
        if (!prefixesMTN.includes(search)) {
          throw new Error("Invalid MTN number");
        }
        break;
      case "glo":
        const prefixesGLO = [
          "0805",
          "0807",
          "0705",
          "0815",
          "0811",
          "0905",
          "0915",
        ];
        if (!prefixesGLO.includes(search)) {
          throw new Error("Invalid GLO number");
        }
        break;
      case "airtel":
        var prefixesAirtel = [
          "0802",
          "0808",
          "0708",
          "0812",
          "0701",
          "0902",
          "0901",
          "0904",
          "0907",
          "0912",
        ];
        if (!prefixesAirtel.includes(search)) {
          throw new Error("Invalid AIRTEL number");
        }
      case "9mobile":
        var prefixes9Mobile = ["0809", "0818", "0817", "0909", "0908"];
        if (!prefixes9Mobile.includes(search)) {
          throw new Error("Invalid 9mobile number");
        }
        break;
      default:
        throw new Error("Invalid number");
    }
  } catch (error) {
    throw new Error("Invalid number");
  }
};
