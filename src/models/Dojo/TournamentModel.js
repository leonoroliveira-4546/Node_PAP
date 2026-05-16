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
  }
});

module.exports = mongoose.models.dojo_tournaments || mongoose.model("dojo_tournaments", TournamentModel);