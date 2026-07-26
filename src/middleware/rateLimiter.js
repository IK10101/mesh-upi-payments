const rateLimit = require('express-rate-limit');

const paymentRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, 
  keyGenerator: (req) => {
    return req.bridgeNode?.nodeId || req.ip;
  },
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = paymentRateLimiter;