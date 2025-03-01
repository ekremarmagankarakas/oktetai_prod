const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');
const bcrypt = require('bcrypt');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new LocalStrategy(async (username, password, done) => {
    try {
        // Find user by username
        const user = await User.findOne({ username: username });
        
        // Security best practice: Use same message for all authentication failures
        const genericErrorMessage = 'Invalid username or password.';
        
        // Check if user exists
        if (!user) {
            // Delay response to prevent timing attacks
            await new Promise(resolve => setTimeout(resolve, 500));
            return done(null, false, { message: genericErrorMessage });
        }
        
        // Check if account is disabled
        if (user.disabled) {
            return done(null, false, { message: 'This account has been disabled. Please contact support.' });
        }
        
        // Check if account is locked due to too many failed attempts
        if (user.isLocked && user.isLocked()) {
            return done(null, false, { 
                message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.' 
            });
        }
        
        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (isMatch) {
            // Reset login attempts on successful login
            user.loginAttempts = 0;
            user.lockUntil = undefined;
            user.lastLogin = new Date();
            
            // Store IP address and user agent for audit
            user.lastIpAddress = this?.req?.ip || 'unknown';
            user.userAgent = this?.req?.headers['user-agent'] || 'unknown';
            
            await user.save();
            return done(null, user);
        } else {
            // Increment login attempts on failed login
            await user.incrementLoginAttempts();
            return done(null, false, { message: genericErrorMessage });
        }
    } catch (err) {
        console.error('Authentication error:', err);
        return done(err);
    }
}));

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENTID,
    clientSecret: process.env.GOOGLE_CLIENTSECRET,
    callbackURL: process.env.GOOGLE_CALLBACKURL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if the user already exists in your database
      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        // If not, create a new user
        user = new User({
          googleId: profile.id,
          username: profile.displayName,
          email: profile.emails[0].value
        });
        await user.save();
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

module.exports = passport;
