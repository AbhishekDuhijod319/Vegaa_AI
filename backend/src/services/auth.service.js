const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const config = require('../config/env');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const userRepository = require('../repositories/userRepository');
const axios = require('axios');
const logger = require('../utils/logger');

const BCRYPT_ROUNDS = 12;

const authService = {
  /**
   * Hash a plain-text password.
   */
  async hashPassword(password) {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  },

  /**
   * Compare plain-text password against hash.
   */
  async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  },

  /**
   * Generate a short-lived access token.
   */
  generateAccessToken(user) {
    return jwt.sign(
      { userId: user._id.toString(), email: user.email, role: user.role },
      config.jwt.accessSecret,
      { expiresIn: config.jwt.accessExpiry }
    );
  },

  /**
   * Generate refresh token, store in DB, return token string.
   */
  async generateRefreshToken(user) {
    const token = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + config.jwt.refreshExpiryMs);

    await RefreshToken.create({
      userId: user._id,
      token,
      expiresAt,
    });

    return token;
  },

  /**
   * Generate both tokens and return them with user data.
   */
  async generateTokenPair(user) {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);
    return { accessToken, refreshToken, user: user.toSafeJSON() };
  },

  /**
   * Register a new user with email + password.
   */
  async register({ name, email, password }) {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      const err = new Error('Email already registered.');
      err.status = 409;
      throw err;
    }

    const passwordHash = await this.hashPassword(password);
    const user = await userRepository.create({
      name,
      email,
      passwordHash,
      authProvider: 'email',
    });

    await userRepository.updateLastLogin(user._id);
    return this.generateTokenPair(user);
  },

  /**
   * Login with email + password.
   */
  async login({ email, password }) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      const err = new Error('Invalid email or password.');
      err.status = 401;
      throw err;
    }

    if (!user.passwordHash) {
      const err = new Error('This account uses Google sign-in. Please use Google to log in.');
      err.status = 401;
      throw err;
    }

    const valid = await this.comparePassword(password, user.passwordHash);
    if (!valid) {
      const err = new Error('Invalid email or password.');
      err.status = 401;
      throw err;
    }

    await userRepository.updateLastLogin(user._id);
    return this.generateTokenPair(user);
  },

  /**
   * Google OAuth login — verify Google token, find or create user.
   */
  async googleLogin({ accessToken }) {
    // Verify token with Google
    let profile;
    try {
      const resp = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      profile = resp.data;
    } catch (error) {
      logger.error('Google token verification failed:', error.message);
      const err = new Error('Invalid Google token.');
      err.status = 401;
      throw err;
    }

    if (!profile.email) {
      const err = new Error('Google profile missing email.');
      err.status = 400;
      throw err;
    }

    // Find existing user by googleId or email
    let user = await userRepository.findByGoogleId(profile.sub);
    if (!user) {
      user = await userRepository.findByEmail(profile.email);
    }

    if (user) {
      // Update profile info from Google
      user.name = profile.name || user.name;
      user.picture = profile.picture || user.picture;
      user.googleId = profile.sub;
      user.lastLoginAt = new Date();
      await user.save();
    } else {
      // Create new user
      user = await userRepository.create({
        email: profile.email,
        name: profile.name || 'Traveler',
        picture: profile.picture || '',
        googleId: profile.sub,
        authProvider: 'google',
        lastLoginAt: new Date(),
      });
    }

    return this.generateTokenPair(user);
  },

  /**
   * Refresh access token using a valid refresh token.
   * Implements token rotation: old token deleted, new one issued.
   */
  async refresh(refreshTokenStr) {
    if (!refreshTokenStr) {
      const err = new Error('No refresh token provided.');
      err.status = 401;
      throw err;
    }

    const tokenDoc = await RefreshToken.findOne({ token: refreshTokenStr });
    if (!tokenDoc) {
      const err = new Error('Invalid refresh token.');
      err.status = 401;
      throw err;
    }

    if (tokenDoc.expiresAt < new Date()) {
      await RefreshToken.deleteOne({ _id: tokenDoc._id });
      const err = new Error('Refresh token expired.');
      err.status = 401;
      throw err;
    }

    const user = await User.findById(tokenDoc.userId);
    if (!user) {
      await RefreshToken.deleteOne({ _id: tokenDoc._id });
      const err = new Error('User not found.');
      err.status = 401;
      throw err;
    }

    // Rotate: delete old token, create new pair
    await RefreshToken.deleteOne({ _id: tokenDoc._id });
    return this.generateTokenPair(user);
  },

  /**
   * Logout: delete the refresh token from DB.
   */
  async logout(refreshTokenStr) {
    if (refreshTokenStr) {
      await RefreshToken.deleteOne({ token: refreshTokenStr });
    }
  },

  /**
   * Delete all refresh tokens for a user (e.g. password change).
   */
  async revokeAllTokens(userId) {
    await RefreshToken.deleteMany({ userId });
  },
};

module.exports = authService;
