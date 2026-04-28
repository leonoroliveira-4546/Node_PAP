const mongoose = require('mongoose');

const PredictionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true,
      index: true,
    },
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'tournaments',
      required: true,
      index: true,
    },
    predictedWinner: {
      type: String,
      required: true,
    },
    pointsEarned: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

PredictionSchema.index({ userId: 1, tournamentId: 1 }, { unique: true });

module.exports = mongoose.model('predictions', PredictionSchema);
