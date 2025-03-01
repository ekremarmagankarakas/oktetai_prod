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
    // Check if user already exists (both username and email)
    const existingUser = await User.findOne({ 
      $or: [{ username: username }, { email: email }] 
    });
    
    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).render('register', { message: 'Username is already taken.' });
      } else {
        return res.status(400).render('register', { message: 'Email is already registered.' });
      }
    }
    
    // Create new user
    const user = new User({ username, password, email });
    await user.save();
    
    // Log successful registration
    console.log(`New user registered: ${username} (${email})`);
    
    res.redirect('/login');
  } catch (err) {
    console.error('Registration error:', err);
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
    // Record login for security auditing
    const user = req.user;
    user.lastLogin = new Date();
    user.lastIpAddress = req.ip || 'unknown';
    user.userAgent = req.headers['user-agent'] || 'unknown';
    user.loginAttempts = 0; // Reset failed login attempts
    user.lockUntil = undefined;
    
    await user.save();
    
    // Session management - limit to 2 active sessions per user
    try {
      const userId = user._id.toString();
      const sessionsCollection = mongoose.connection.collection('sessions');
      
      // Find all sessions
      const allSessions = await sessionsCollection.find().toArray();
      
      // Filter sessions with proper error handling
      const userSessions = [];
      
      for (const sessionDoc of allSessions) {
        try {
          // Check if session data exists and is a valid string
          if (sessionDoc.session && typeof sessionDoc.session === 'string') {
            const sessionData = JSON.parse(sessionDoc.session);
            
            // Add session to user sessions if it belongs to current user
            if (sessionData?.passport?.user === userId) {
              userSessions.push(sessionDoc);
            }
          }
        } catch (e) {
          console.error('Failed to parse session data:', e);
          // Continue to next session rather than crashing
        }
      }
      
      // Sort and manage sessions
      if (userSessions.length > 2) {
        // Sort sessions by expiry date (oldest first)
        userSessions.sort((a, b) => {
          const aExpires = a.expires ? new Date(a.expires) : new Date(0);
          const bExpires = b.expires ? new Date(b.expires) : new Date(0);
          return aExpires - bExpires;
        });
        
        // Keep only the 2 most recent sessions
        const sessionsToKeep = userSessions.slice(-2);
        const sessionsToDelete = userSessions.filter(
          session => !sessionsToKeep.includes(session)
        );
        
        // Delete older sessions
        for (const session of sessionsToDelete) {
          try {
            await sessionsCollection.deleteOne({ _id: session._id });
          } catch (e) {
            console.error(`Failed to delete session with ID: ${session._id}`, e);
          }
        }
      }
    } catch (sessionErr) {
      // Log session error but continue - don't prevent login
      console.error('Error managing sessions:', sessionErr);
    }
    
    // Redirect to dashboard
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Login error:', err);
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
    // Apply rate limiting for password reset attempts
    // This would be implemented in middleware attached to the route
    
    // Security best practice: Don't reveal if email exists or not
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      // For security, use the same message even if user doesn't exist
      // This prevents email enumeration attacks
      req.flash('error', 'If an account with that email exists, a password reset link has been sent.');
      return res.redirect('/forgot-password');
    }

    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');
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

    // Use https instead of http for password reset links
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    
    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_FROM,
      subject: 'Password Reset',
      text: `
        You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n
        ${protocol}://${req.headers.host}/reset-password/${token}\n\n
        This link will expire in 1 hour.\n\n
        If you did not request this, please ignore this email and contact support if you're concerned about your account security.\n`,
    };

    await transporter.sendMail(mailOptions);
    
    // For security, use the same message even if email is sent successfully
    req.flash('error', 'If an account with that email exists, a password reset link has been sent.');
    res.redirect('/forgot-password');
    
    // Log the password reset attempt (but don't expose this to the user)
    console.log(`Password reset requested for email: ${req.body.email}`);
    
  } catch (err) {
    console.error('Password reset error:', err);
    req.flash('error', 'An unexpected error occurred. Please try again later.');
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
    // Find user with valid, non-expired token
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot-password');
    }

    // Check if passwords match
    if (req.body.password !== req.body.confirmPassword) {
      req.flash('error', 'Passwords do not match.');
      return res.redirect('back');
    }

    // Validate password strength
    const { validatePassword } = require('../middleware/validationMiddleware');
    if (!validatePassword(req.body.password)) {
      req.flash('error', 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.');
      return res.redirect('back');
    }

    // Update user's password and clear reset token
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    // Account lockout reset - if you implement account lockout, reset failed attempts
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    
    await user.save();

    // Invalidate all existing sessions for security
    const sessionsCollection = mongoose.connection.collection('sessions');
    await sessionsCollection.deleteMany({ 'session.passport.user': user._id.toString() });

    // Log password change
    console.log(`Password reset successful for user: ${user.username}`);

    req.flash('success', 'Your password has been successfully updated. Please login with your new password.');
    res.redirect('/login');
  } catch (err) {
    console.error('Password reset error:', err);
    req.flash('error', 'An unexpected error occurred. Please try again later.');
    res.redirect('/forgot-password');
  }
};
