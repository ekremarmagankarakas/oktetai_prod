const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');
const bcrypt = require('bcrypt');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new LocalStrategy(async (username, password, done) => {
    try {
        const user = await User.findOne({ username: username });
        if (!user) {
            return done(null, false, { message: 'Incorrect username.' });
        }
        if (user.disabled) {
          return done(null, false, { message: 'This account has been disabled.' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            return done(null, user);
        } else {
            return done(null, false, { message: 'Incorrect password.' });
        }
    } catch (err) {
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
