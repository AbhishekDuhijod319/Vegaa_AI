const authService = require('../services/auth.service');
const User = require('../models/User');
const config = require('../config/env');

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: config.jwt.refreshExpiryMs,
  path: '/',
};

const authController = {
  async register(req, res) {
    const result = await authService.register(req.body);
    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
    res.status(201).json({ accessToken: result.accessToken, user: result.user });
  },

  async login(req, res) {
    const result = await authService.login(req.body);
    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
    res.json({ accessToken: result.accessToken, user: result.user });
  },

  async googleLogin(req, res) {
    const result = await authService.googleLogin(req.body);
    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
    res.json({ accessToken: result.accessToken, user: result.user });
  },

  async refresh(req, res) {
    const refreshToken = req.cookies?.refreshToken;
    const result = await authService.refresh(refreshToken);
    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
    res.json({ accessToken: result.accessToken, user: result.user });
  },

  async logout(req, res) {
    const refreshToken = req.cookies?.refreshToken;
    await authService.logout(refreshToken);
    res.clearCookie('refreshToken', { path: '/' });
    res.json({ message: 'Logged out successfully.' });
  },

  async me(req, res) {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: user.toSafeJSON() });
  },
};

module.exports = authController;
