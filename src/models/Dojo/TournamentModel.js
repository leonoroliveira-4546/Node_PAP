const mongoose = require('mongoose');

const TournamentModel = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  location: { 
    type: String, 
    required: true 
  },
  dojo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'dojos'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'finished'],
    default: 'open'
  },
  winner: {
    type: String,
    default: null
  }
});

const Tournament = mongoose.model("tournaments", TournamentModel);
module.exports = Tournament;