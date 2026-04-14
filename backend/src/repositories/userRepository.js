const User = require('../models/User');

const userRepository = {
  async findByEmail(email) {
    return User.findOne({ email: email.toLowerCase() });
  },

  async findByGoogleId(googleId) {
    return User.findOne({ googleId });
  },

  async findById(userId) {
    return User.findById(userId);
  },

  async create(data) {
    const user = new User(data);
    await user.save();
    return user;
  },

  async updateLastLogin(userId) {
    return User.findByIdAndUpdate(userId, { lastLoginAt: new Date() }, { new: true });
  },

  async updatePreferences(userId, preferences) {
    return User.findByIdAndUpdate(
      userId,
      { $set: { preferences } },
      { new: true }
    );
  },

  async updatePicture(userId, pictureUrl) {
    return User.findByIdAndUpdate(
      userId,
      { $set: { picture: pictureUrl } },
      { new: true }
    );
  },

  async updateName(userId, name) {
    return User.findByIdAndUpdate(
      userId,
      { $set: { name } },
      { new: true }
    );
  },

  async updateEmail(userId, email) {
    return User.findByIdAndUpdate(
      userId,
      { $set: { email: email.toLowerCase().trim() } },
      { new: true }
    );
  },

  async updateProfile(userId, updates) {
    const allowed = {};
    if (updates.name !== undefined) allowed.name = updates.name.trim();
    if (updates.email !== undefined) allowed.email = updates.email.toLowerCase().trim();
    if (!Object.keys(allowed).length) return User.findById(userId);
    return User.findByIdAndUpdate(userId, { $set: allowed }, { new: true });
  },

  async scheduleDeletion(userId) {
    const deletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    return User.findByIdAndUpdate(
      userId,
      { $set: { deletionScheduledAt: deletionDate } },
      { new: true }
    );
  },

  async cancelDeletion(userId) {
    return User.findByIdAndUpdate(
      userId,
      { $set: { deletionScheduledAt: null } },
      { new: true }
    );
  },

  async deleteById(userId) {
    return User.findByIdAndDelete(userId);
  },

  /** Find all users whose deletion date has passed — for cleanup cron */
  async findScheduledForDeletion() {
    return User.find({
      deletionScheduledAt: { $ne: null, $lte: new Date() },
    });
  },
};

module.exports = userRepository;
