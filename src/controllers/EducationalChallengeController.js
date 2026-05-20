const Challenge = require('../models/Educational/ChallengeModel');
const ChallengeResponse = require('../models/Educational/ChallengeResponseModel');
const Users = require('../models/UsersModel');

const EducationalChallengeController = {
  createChallenge: async (req, res) => {
    try {
      const { title, description, dojoId, date, type, options, correctAnswer, points, expireAt } = req.body;
      // Only sensei or admin can create - check req.user.type
      if (!req.user || !['sensei', 'admin'].includes(req.user.type)) {
        return res.status(403).json({ success: false, message: 'Permissão negada.' });
      }

      const challenge = await Challenge.create({
        title,
        description,
        dojoId,
        date,
        type,
        options,
        correctAnswer,
        points: points || 20,
        createdBy: req.user._id,
        expireAt: expireAt ? new Date(expireAt) : (date ? new Date(new Date(date + 'T23:59:59')) : null)
      });

      return res.status(201).json({ success: true, challenge });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Erro ao criar desafio.' });
    }
  },

  getCurrentChallenge: async (req, res) => {
    try {
      const { dojoId } = req.params;
      const today = new Date().toISOString().slice(0, 10);
      const now = new Date();
      const challenge = await Challenge.findOne({
        dojoId,
        $or: [ { date: today }, { date: { $exists: false } }, { date: '' } ],
        $or: [ { expireAt: null }, { expireAt: { $gt: now } } ]
      }).sort({ createdAt: -1 });

      if (!challenge) return res.json({ success: true, challenge: null });
      return res.json({ success: true, challenge });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Erro ao buscar desafio.' });
    }
  },

  submitResponse: async (req, res) => {
    try {
      const { id } = req.params; // challenge id
      const { response } = req.body;
      const user = req.user;
      if (!user) return res.status(401).json({ success: false, message: 'Autenticação necessária.' });

      const challenge = await Challenge.findById(id);
      if (!challenge) return res.status(404).json({ success: false, message: 'Desafio não encontrado.' });

      // Check TTL/expire
      if (challenge.expireAt && new Date() > new Date(challenge.expireAt)) {
        return res.status(410).json({ success: false, message: 'Desafio expirado.' });
      }

      // Check if already answered
      const existing = await ChallengeResponse.findOne({ challengeId: id, athleteId: user._id });
      if (existing) return res.status(400).json({ success: false, message: 'Você já respondeu a este desafio.' });

      const correct = (challenge.correctAnswer || '').trim().toLowerCase() === (response || '').trim().toLowerCase();
      const pointsEarned = correct ? (challenge.points || 0) : 0;

      const resp = await ChallengeResponse.create({
        challengeId: id,
        athleteId: user._id,
        athleteName: user.username,
        response,
        correct,
        pointsEarned
      });

      if (correct) {
        await Users.findByIdAndUpdate(user._id, { $inc: { points: pointsEarned } });
      }

      return res.json({ success: true, resp, pointsEarned, correct });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Erro ao salvar resposta.' });
    }
  },

  deleteChallenge: async (req, res) => {
    try {
      const { id } = req.params;
      // permission check
      if (!req.user || !['sensei', 'admin'].includes(req.user.type)) {
        return res.status(403).json({ success: false, message: 'Permissão negada.' });
      }
      const deleted = await Challenge.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ success: false, message: 'Desafio não encontrado.' });
      // also remove responses
      await ChallengeResponse.deleteMany({ challengeId: id });
      return res.json({ success: true, message: 'Desafio removido.' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Erro ao remover desafio.' });
    }
  }
};

module.exports = EducationalChallengeController;
