const mongoose = require('mongoose')

const PredictionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'tournaments', required: true },
  predictedWinner: { type: String, required: true },
  pointsEarned: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('predictions', PredictionSchema)
