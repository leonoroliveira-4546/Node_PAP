const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  belt: { type: String, default: 'Branca' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', default: null }
});

const TournamentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  dojo: { type: mongoose.Schema.Types.ObjectId, ref: 'dojos', required: false, default: null },
  status: { type: String, enum: ['open', 'closed', 'finished'], default: 'open' },
  participants: [ParticipantSchema],
  winner: { type: String, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', default: null }
}, { timestamps: true });

module.exports = mongoose.models.tournaments || mongoose.model('tournaments', TournamentSchema);
