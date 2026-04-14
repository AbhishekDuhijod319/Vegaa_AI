const userService = require('../services/user.service');
const userRepository = require('../repositories/userRepository');

const userController = {
  /**
   * PUT /api/users/avatar
   * Upload a new profile picture. Expects multipart/form-data with field 'avatar'.
   */
  async updateAvatar(req, res) {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided. Use field name "avatar".' });
    }

    // Validate file type
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF.' });
    }

    // Get current user for old picture cleanup
    const currentUser = await userRepository.findById(req.user.userId);
    const oldPictureUrl = currentUser?.picture || '';

    // Upload to Cloudinary
    const { secureUrl } = await userService.updateAvatar(
      req.user.userId,
      req.file.buffer,
      oldPictureUrl
    );

    // Update MongoDB
    await userRepository.updatePicture(req.user.userId, secureUrl);

    res.json({
      message: 'Avatar updated successfully.',
      picture: secureUrl,
    });
  },

  /**
   * PUT /api/users/profile
   * Update user profile (name, email).
   */
  async updateProfile(req, res) {
    const { name, email } = req.body;

    // Validate
    if (name !== undefined && (typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 100)) {
      return res.status(400).json({ error: 'Name must be between 1 and 100 characters.' });
    }

    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Please provide a valid email address.' });
      }

      // Check if email is already taken by another user
      const existing = await userRepository.findByEmail(email);
      if (existing && existing._id.toString() !== req.user.userId) {
        return res.status(409).json({ error: 'This email is already in use.' });
      }
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;

    const user = await userRepository.updateProfile(req.user.userId, updates);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({
      message: 'Profile updated successfully.',
      user: user.toSafeJSON(),
    });
  },

  /**
   * POST /api/users/schedule-deletion
   * Schedule account for deletion in 30 days.
   */
  async scheduleDeletion(req, res) {
    const result = await userService.scheduleDeletion(req.user.userId);

    res.json({
      message: result.message,
      deletionScheduledAt: result.deletionScheduledAt,
    });
  },

  /**
   * POST /api/users/cancel-deletion
   * Cancel a previously scheduled account deletion.
   */
  async cancelDeletion(req, res) {
    await userService.cancelDeletion(req.user.userId);

    res.json({
      message: 'Account deletion cancelled successfully. Your account is now active.',
    });
  },
};

module.exports = userController;
