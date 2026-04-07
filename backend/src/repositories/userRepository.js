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
};

module.exports = userRepository;
