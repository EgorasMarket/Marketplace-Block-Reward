var { google } = require("googleapis");
const https = require("https");
var MESSAGING_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";
var SCOPES = [MESSAGING_SCOPE];

var PROJECT_ID = "fort-44f3c";
var HOST = "fcm.googleapis.com";
var PATH = "/v1/projects/" + PROJECT_ID + "/messages:send";

module.exports.getAccessToken = () => {
  return new Promise(function (resolve, reject) {
    var key = require("../config/serviceAccount.json");
    var jwtClient = new google.auth.JWT(
      key.client_email,
      null,
      key.private_key,
      SCOPES,
      null
    );
    jwtClient.authorize(function (err, tokens) {
      if (err) {
        reject(err);
        return;
      }
      resolve(tokens.access_token);
    });
  });
};
module.exports.sendFcmMessage = (fcmMessage, accessToken) => {
  try {
    var options = {
      hostname: HOST,
      path: PATH,
      method: "POST",
      headers: {
        Authorization: "Bearer " + accessToken,
      },
      // … plus the body of your notification or data message
    };
    var request = https.request(options, function (resp) {
      resp.setEncoding("utf8");
      resp.on("data", function (data) {
        console.log(data);
      });
    });
    request.on("error", function (err) {
      console.log(err);
    });
    request.write(JSON.stringify(fcmMessage));
    request.end();
  } catch (error) {
    console.log(error);
  }
};
