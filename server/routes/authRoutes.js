const express = require('express');
const passport = require('passport');
const authController = require('../controllers/authController');
const { validateRegistration, sanitizeBody, passwordResetLimiter } = require('../middleware/validationMiddleware');
const { loginLimiter } = require('../middleware/rateLimiter');
const router = express.Router();

// Apply input sanitization to all auth routes
router.use(sanitizeBody);

// Registration routes with validation
router.get('/register', authController.getRegister);
router.post('/register', validateRegistration, authController.postRegister);

// Login routes with rate limiting
router.get('/login', authController.getLogin);
router.post(
  '/login',
  loginLimiter,
  passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),
  authController.handleLogin
);

// Logout route
router.get('/logout', authController.logout);

// Google OAuth routes
router.get('/auth/google', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  // Add prompt parameter to always ask for consent (prevents automatic login)
  prompt: 'select_account'
}));
router.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  authController.googleCallback
);

// Password reset routes with rate limiting
router.get('/forgot-password', authController.getForgotPassword);
router.post('/forgot-password', passwordResetLimiter, authController.postForgotPassword);

router.get('/reset-password/:token', authController.getResetPassword);
router.post('/reset-password/:token', authController.postResetPassword);

module.exports = router;
