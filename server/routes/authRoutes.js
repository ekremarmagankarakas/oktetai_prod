const express = require('express');
const passport = require('passport');
const authController = require('../controllers/authController');
const router = express.Router();

router.get('/register', authController.getRegister);
router.post('/register', authController.postRegister);

router.get('/login', authController.getLogin);
router.post(
  '/login',
  passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),
  authController.handleLogin
);

router.get('/logout', authController.logout);

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  authController.googleCallback
);

router.get('/forgot-password', authController.getForgotPassword);
router.post('/forgot-password', authController.postForgotPassword);

router.get('/reset-password/:token', authController.getResetPassword);
router.post('/reset-password/:token', authController.postResetPassword);

module.exports = router;
