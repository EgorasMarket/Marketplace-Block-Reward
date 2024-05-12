require("dotenv").config();
const Ably = require("ably");

let realtime = null;
exports.init_ably = () => {
  realtime = new Ably.Realtime({
    key: "_ZaZIA.zrkh6g:Olv__ikkLdWpwbAxH-pK5mM5_fbyP7gRVRbqouGO6S4",
  });
  realtime.connection.once("connected", () => {
    console.log(" Connected to Ably!");
  });
};

exports.getAblyInstance = () => {
  return realtime;
};
