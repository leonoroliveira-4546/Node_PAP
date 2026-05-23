const mongoose = require('mongoose')

const ChallengeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  dojoId: { type: mongoose.Schema.Types.ObjectId, ref: 'dojos', required: true },
  date: { type: String }, // YYYY-MM-DD optional
  type: { type: String, enum: ['text-short', 'text-long', 'multiple-choice', 'single-choice'], default: 'text-short' },
  options: [{ type: String }],
  correctAnswer: { type: String },
  points: { type: Number, default: 20 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  expireAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
})

// TTL index to automatically remove expired challenges
ChallengeSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 })

module.exports = mongoose.model('challenges', ChallengeSchema)
