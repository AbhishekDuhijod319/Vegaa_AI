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

// PUT /api/users/profile — Update name/email
router.put(
  '/profile',
  authenticate,
  asyncHandler(userController.updateProfile)
);

// POST /api/users/schedule-deletion — Schedule account deletion (30-day grace)
router.post(
  '/schedule-deletion',
  authenticate,
  asyncHandler(userController.scheduleDeletion)
);

// POST /api/users/cancel-deletion — Cancel scheduled deletion
router.post(
  '/cancel-deletion',
  authenticate,
  asyncHandler(userController.cancelDeletion)
);

module.exports = router;
