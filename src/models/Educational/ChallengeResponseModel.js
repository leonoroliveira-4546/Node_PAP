const mongoose = require('mongoose');

const ChallengeResponseSchema = new mongoose.Schema({
  challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'challenges', required: true },
  athleteId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  athleteName: { type: String },
  response: { type: String },
  correct: { type: Boolean, default: false },
  pointsEarned: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('challengeResponses', ChallengeResponseSchema);
