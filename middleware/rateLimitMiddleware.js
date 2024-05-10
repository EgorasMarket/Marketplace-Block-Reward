const { getRan } = require("../helpers");

const rateLimit = require("express-rate-limit");

// Function to create a rate limiter middleware
const createRateLimiter = (options) => {
  // Create a new rate limiter instance
  const limiter = rateLimit(options);

  // Return the actual middleware function
  return (req, res, next) => {
    setTimeout(() => {
      limiter(req, res, (err) => {
        if (err) {
          // Handle rate limit exceeded error
          res.status(429).json({ error: "Too Many Requests" });
        } else {
          // Proceed to the next middleware or route handler
          next();
        }
      });
    }, getRan(1, 300));
  };
};

exports.transaction = createRateLimiter({
  windowMs: 0.5 * 60 * 1000, // 5 Secs
  max: 1, // Max number of requests
  message: {
    code: 429,
    errorMessage: "Too many requests, please try again later.",
    error: {},
    data: null,
    success: false,
  },
  keyGenerator: (req) =>
    // Generate a unique key based on the token
    req.user.email, // Assuming the token is provided in the Authorization header
});

exports.loginLimiter = createRateLimiter({
  windowMs: 20000, // 5 Secs
  max: 1, // Max number of requests
  message: {
    code: 429,
    errorMessage: "Too many requests, please try again later.",
    error: {},
    data: null,
    success: false,
  },
});

exports.smsOtpLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 5 Secs
  max: 1, // Max number of requests
  message: {
    code: 429,
    errorMessage: "Too many requests, please try again later.",
    error: {},
    data: null,
    success: false,
  },
});

exports.emailOtpLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 5 Secs
  max: 1, // Max number of requests
  message: {
    code: 429,
    errorMessage: "Too many requests, please try again later.",
    error: {},
    data: null,
    success: false,
  },
});
