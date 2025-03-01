const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: 'Too many login attempts. Please try again later.',
});


const premiumApiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 200, // Limit each IP to 200 requests
  handler: (req, res) => {
    res.status(429).json({
      error: "Too many requests",
      message: "You have exceeded the maximum number of requests allowed.",
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000) || 600,
    });
  },
});

const generalApiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // Limit each IP to 10 requests
  handler: (req, res) => {
    res.status(429).json({
      error: "Too many requests",
      message: "You have exceeded the maximum number of requests allowed.",
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000) || 600,
    });
  },
});

// Middleware to select the appropriate limiter
function subscriptionBasedRateLimiter(req, res, next) {
  const user = req.user;

  if (!user || user.subscriptionPlan === 'basic') {
    return generalApiLimiter(req, res, next);
  } else if (['premium', 'enterprise'].includes(user.subscriptionPlan)) {
    return premiumApiLimiter(req, res, next);
  } else {
    return generalApiLimiter(req, res, next);
  }
}

module.exports = { subscriptionBasedRateLimiter, loginLimiter };