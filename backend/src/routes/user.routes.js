const express = require('express');
const router = express.Router();
const multer = require('multer');
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimit');
const { asyncHandler } = require('../utils/helpers');

// Multer config: memory storage (buffer), 5MB max
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
});

// PUT /api/users/avatar — Upload a new profile picture
router.put(
  '/avatar',
  authenticate,
  uploadLimiter,
  upload.single('avatar'),
  asyncHandler(userController.updateAvatar)
);

module.exports = router;
