const { errorResponse } = require("../helpers");
const { User, Staff } = require("../models");

const jwt = require("jsonwebtoken");

const apiAuth = async (req, res, next) => {
  if (!(req.headers && req.headers["x-token"])) {
    return errorResponse(req, res, "Token is not provided", 401);
  }
  const token = req.headers["x-token"];
  try {
    const decoded = jwt.verify(token, process.env.SECRET);
    req.user = decoded.user;
    if (req.user.staffId) {
      const staff = await Staff.findOne({
        where: { email: req.user.email },
      });
      if (!staff) {
        return errorResponse(req, res, "Staff is not found in system", 401);
      }

      // hello world
      const reqUser = { ...staff.get() };

      reqUser.userId = staff.id;
      reqUser.staffId = staff.staffId;
      req.user = reqUser;

      return next();
    }
    if (req.user.userId) {
      const user = await User.scope("withSecretColumns").findOne({
        where: { email: req.user.email },
      });
      if (!user) {
        return errorResponse(
          req,
          res,
          "User record not located within the system.",
          401
        );
      }
      const reqUser = { ...user.get() };
      reqUser.userId = user.id;
      req.user = reqUser;
      return next();
    }
  } catch (error) {
    return errorResponse(req, res, "Invalid token. Please log in again.", 401);
  }
};

module.exports = apiAuth;
