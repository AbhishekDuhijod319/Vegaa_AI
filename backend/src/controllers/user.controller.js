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
};

module.exports = userController;
