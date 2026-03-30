const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userEmail: { type: String, required: true, index: true },
    destination: { type: String, default: '', index: true },
    summary: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'generated', 'archived'],
      default: 'generated',
    },
    userSelection: {
      destination: { type: mongoose.Schema.Types.Mixed },
      startLocation: { type: mongoose.Schema.Types.Mixed },
      startDate: { type: String },
      endDate: { type: String },
      currency: { type: String, default: 'INR' },
      amount: { type: Number },
      numTravelers: { type: Number, default: 1 },
      transportMode: { type: String },
      noOfDays: { type: Number },
    },
    tripData: { type: mongoose.Schema.Types.Mixed, default: {} },
    coverPhotoUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

tripSchema.index({ userId: 1, createdAt: -1 });
tripSchema.index({ destination: 'text', summary: 'text' });

module.exports = mongoose.model('Trip', tripSchema);
