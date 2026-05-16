const Tournament = require('../models/Predictions/TournamentModel');
const Prediction = require('../models/Predictions/PredictionModel');

const PredictionsController = {
  getTournaments: async (req, res) => {
    try {
      const tournaments = await Tournament.find().sort({ date: -1 });
      return res.json({ success: true, tournaments });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Erro ao buscar torneios.' });
    }
  },

  getMyPredictions: async (req, res) => {
    try {
      const predictions = await Prediction.find({ userId: req.user._id }).lean();
      return res.json({ success: true, predictions });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Erro ao buscar predições.' });
    }
  },

  submitPrediction: async (req, res) => {
    try {
      const { tournamentId, predictedWinner } = req.body;
      if (!tournamentId || !predictedWinner) {
        return res.status(400).json({ success: false, message: 'Torneio e previsão são obrigatórios.' });
      }

      const existing = await Prediction.findOne({ userId: req.user._id, tournamentId });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Você já enviou uma predição para este torneio.' });
      }

      const prediction = await Prediction.create({
        userId: req.user._id,
        tournamentId,
        predictedWinner,
        pointsEarned: 0
      });

      return res.status(201).json({ success: true, prediction });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Erro ao enviar predição.' });
    }
  },

  createTournament: async (req, res) => {
    try {
      const { name, date, location, participants, status, winner } = req.body;
      const tournament = await Tournament.create({
        name,
        date,
        location,
        participants: participants || [],
        status: status || 'open',
        winner: winner || null,
        createdBy: req.user._id
      });
      return res.status(201).json({ success: true, tournament });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Erro ao criar torneio.' });
    }
  },

  updateTournament: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const tournament = await Tournament.findByIdAndUpdate(id, updates, { new: true });
      if (!tournament) {
        return res.status(404).json({ success: false, message: 'Torneio não encontrado.' });
      }
      return res.json({ success: true, tournament });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Erro ao atualizar torneio.' });
    }
  }
};

module.exports = PredictionsController;
