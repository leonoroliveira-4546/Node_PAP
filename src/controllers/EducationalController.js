const Educational = require('../models/Educational/EducationalModel');
const Users = require('../models/UsersModel');
const ChallengeResponse = require('../models/Educational/ChallengeResponseModel');

const EducationalController = {
  getContent: async (req, res) => {
    try {
      const filter = req.user?.type === 'admin' ? {} : { published: true };
      const content = await Educational.find(filter).sort({ createdAt: -1 });
      return res.json({ success: true, content });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Erro ao buscar conteúdo educacional.' });
    }
  },

  createContent: async (req, res) => {
    try {
      const { title, description, category, url, contentType, published, gameData } = req.body;
      const item = await Educational.create({
        title,
        description,
        category,
        url: url || undefined,
        contentType: contentType || 'video',
        published: published !== undefined ? Boolean(published) : true,
        gameData: contentType === 'game' ? gameData : undefined,
        createdBy: req.user._id
      });
      return res.status(201).json({ success: true, content: item });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Erro ao criar conteúdo educacional.' });
    }
  },

  deleteContent: async (req, res) => {
    try {
      const { id } = req.params;
      const item = await Educational.findByIdAndDelete(id);
      if (!item) {
        return res.status(404).json({ success: false, message: 'Conteúdo não encontrado.' });
      }
      return res.json({ success: true, message: 'Conteúdo educacional removido com sucesso.' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Erro ao remover conteúdo educacional.' });
    }
  },

  updateContent: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, category, url, contentType, published, gameData } = req.body;
      const updates = {
        title,
        description,
        category,
        url: url || undefined,
        contentType,
        published,
        gameData: contentType === 'game' ? gameData : undefined
      };
      const item = await Educational.findByIdAndUpdate(id, updates, { new: true });
      if (!item) {
        return res.status(404).json({ success: false, message: 'Conteúdo não encontrado.' });
      }
      return res.json({ success: true, content: item });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Erro ao atualizar conteúdo educacional.' });
    }
  },

  submitGameResponse: async (req, res) => {
    try {
      const { id } = req.params;
      const { answer } = req.body;
      const user = req.user;
      if (!user) return res.status(401).json({ success: false, message: 'Autenticação necessária.' });

      const item = await Educational.findById(id);
      if (!item) return res.status(404).json({ success: false, message: 'Conteúdo não encontrado.' });
      if (item.contentType !== 'game' || !item.gameData) {
        return res.status(400).json({ success: false, message: 'Conteúdo não é um jogo.' });
      }

      const existing = await ChallengeResponse.findOne({ challengeId: id, athleteId: user._id });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Você já respondeu a este jogo.' });
      }

      const correct = (item.gameData.correctAnswer || '').trim().toLowerCase() === (answer || '').trim().toLowerCase();
      const pointsEarned = correct ? (item.gameData.points || 0) : 0;

      await ChallengeResponse.create({
        challengeId: id,
        athleteId: user._id,
        athleteName: user.username,
        response: answer,
        correct,
        pointsEarned
      });

      if (correct) {
        await Users.findByIdAndUpdate(user._id, { $inc: { points: pointsEarned } });
      }

      return res.json({ success: true, correct, pointsEarned });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Erro ao enviar resposta do jogo.' });
    }
  }
};

module.exports = EducationalController;
