const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcrypt");

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String },
    email: { type: String, required: true, unique: true },
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
    disabled: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

// Pre-save hook to hash password
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;
