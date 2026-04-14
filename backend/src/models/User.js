const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    picture: { type: String, default: '' },
    passwordHash: { type: String, default: null },
    authProvider: {
      type: String,
      enum: ['email', 'google'],
      required: true,
    },
    googleId: { type: String, sparse: true, index: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    lastLoginAt: { type: Date, default: null },
    deletionScheduledAt: { type: Date, default: null },
    preferences: {
      defaultCurrency: { type: String, default: 'INR' },
      theme: { type: String, default: 'light' },
    },
  },
  { timestamps: true }
);

userSchema.methods.toSafeJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);
