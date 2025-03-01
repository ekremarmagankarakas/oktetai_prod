const mongoose = require('mongoose');
const User = require('../models/user');
const passport = require('passport');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// ** Registration Handling **
exports.getRegister = (req, res) => {
  res.render('register', { message: req.flash('error') });
};

exports.postRegister = async (req, res) => {
  const { username, password, email } = req.body;
  try {
    const user = new User({ username, password, email });
    await user.save();
    res.redirect('/login');
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).render('register', { message: 'Username already exists.' });
    }
    res.status(500).render('register', { message: 'An error occurred while registering the user.' });
  }
};

// ** Login Handling **
exports.getLogin = (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect('/dashboard');
  } else {
    res.render('login', { message: req.flash('error') });
  }
};

exports.handleLogin = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    const sessionsCollection = mongoose.connection.collection('sessions');

    const allSessions = await sessionsCollection.find().toArray();

    const userSessions = allSessions.filter((sessionDoc) => {
      try {
        const sessionData = JSON.parse(sessionDoc.session);
        return sessionData.passport?.user === userId;
      } catch (e) {
        console.error('Failed to parse session data:', e);
        return false;
      }
    });

    userSessions.sort((a, b) => {
      const aExpires = a.expires ? new Date(a.expires) : new Date(0);
      const bExpires = b.expires ? new Date(b.expires) : new Date(0);
      return aExpires - bExpires;
    });

    const sessionsToKeep = userSessions.slice(-2);
    const sessionsToDelete = userSessions.filter(session => !sessionsToKeep.includes(session));

    for (const session of sessionsToDelete) {
      try {
        await sessionsCollection.deleteOne({ _id: session._id });
      } catch (e) {
        console.error(`Failed to delete session with ID: ${session._id}`, e);
      }
    }

    res.redirect('/dashboard');
  } catch (err) {
    next(err);
  }
};

// ** Logout Handling **
exports.logout = (req, res) => {
  req.logout(() => {
    req.session.destroy();
    res.redirect('/login');
  });
};

// ** Google OAuth Handling **
exports.googleCallback = (req, res) => {
  if (req.user.disabled) {
    req.logout(() => {
      req.flash('error', 'Your account is disabled.');
      req.session.destroy();
      res.redirect('/login');
    });
  } else {
    res.redirect('/dashboard');
  }
};

// ** Forgot Password **
exports.getForgotPassword = (req, res) => {
  res.render('forgot-password', { message: req.flash('error') });
};

exports.postForgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      req.flash('error', 'No account with that email address exists.');
      return res.redirect('/forgot-password');
    }

    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_FROM,
      subject: 'Password Reset',
      text: `
        You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n
        http://${req.headers.host}/reset-password/${token}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };

    await transporter.sendMail(mailOptions);
    req.flash('error', `An email has been sent to ${user.email} with further instructions.`);
    res.redirect('/forgot-password');
  } catch (err) {
    console.error(err);
    req.flash('error', 'An error occurred while sending the password reset email.');
    res.redirect('/forgot-password');
  }
};

// ** Reset Password **
exports.getResetPassword = async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot-password');
    }

    res.render('reset-password', { token: req.params.token, message: req.flash('error') });
  } catch (err) {
    console.error(err);
    req.flash('error', 'An error occurred while validating the password reset token.');
    res.redirect('/forgot-password');
  }
};

exports.postResetPassword = async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('back');
    }

    if (req.body.password === req.body.confirmPassword) {
      user.password = req.body.password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      const sessionsCollection = mongoose.connection.collection('sessions');
      await sessionsCollection.deleteMany({ 'session.passport.user': user._id.toString() });

      req.flash('success', 'Your password has been successfully updated.');
      res.redirect('/login');
    } else {
      req.flash('error', 'Passwords do not match.');
      res.redirect('back');
    }
  } catch (err) {
    console.error(err);
    req.flash('error', 'An error occurred while resetting the password.');
    res.redirect('back');
  }
};
