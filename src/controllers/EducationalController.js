const Educational = require('../models/Educational/EducationalModel');

const EducationalController = {
  getContent: async (req, res) => {
    try {
      const content = await Educational.find({ published: true }).sort({ createdAt: -1 });
      return res.json({ success: true, content });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Erro ao buscar conteúdo educacional.' });
    }
  },

  createContent: async (req, res) => {
    try {
      const { title, description, category, url, contentType, published } = req.body;
      const item = await Educational.create({
        title,
        description,
        category,
        url,
        contentType: contentType || 'video',
        published: published !== undefined ? Boolean(published) : true,
        createdBy: req.user._id
      });
      return res.status(201).json({ success: true, content: item });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Erro ao criar conteúdo educacional.' });
    }
  },

  updateContent: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const item = await Educational.findByIdAndUpdate(id, updates, { new: true });
      if (!item) {
        return res.status(404).json({ success: false, message: 'Conteúdo não encontrado.' });
      }
      return res.json({ success: true, content: item });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Erro ao atualizar conteúdo educacional.' });
    }
  }
};

module.exports = EducationalController;
