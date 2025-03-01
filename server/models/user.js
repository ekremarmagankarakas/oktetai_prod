const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcrypt");

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    googleId: { type: String },
    subscriptionPlan: { type: String, default: "basic" },
    subscriptionStatus: { type: String },
    customerId: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    apiKeys: {
      openai: { type: String, default: null },
      gemini: { type: String, default: null },
      claude: { type: String, default: null },
      perplexity: { type: String, default: null },
    },
    // Account security fields
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    lastLogin: { type: Date },
    lastIpAddress: { type: String },
    disabled: { type: Boolean, default: false },
    // Token for session validation
    userAgent: { type: String },
    sessionToken: { type: String },
  },
  {
    timestamps: true,
  },
);

// Pre-save hook to hash password
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    // Using a stronger salt factor (12 instead of 10)
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// Method to check if account is locked
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Method to increment login attempts and lock if necessary
userSchema.methods.incrementLoginAttempts = async function() {
  // Reset login attempts if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    this.loginAttempts = 1;
    this.lockUntil = undefined;
    return await this.save();
  }
  
  // Increment login attempts
  this.loginAttempts += 1;
  
  // Lock account if max attempts reached (5 attempts)
  if (this.loginAttempts >= 5) {
    // Lock for 1 hour (3600000 ms)
    this.lockUntil = Date.now() + 3600000;
  }
  
  return await this.save();
};

// Method to secure sensitive data when serializing
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  delete obj.apiKeys;
  delete obj.loginAttempts;
  delete obj.lockUntil;
  delete obj.sessionToken;
  return obj;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
