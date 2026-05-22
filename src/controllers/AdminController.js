const admin = require('../config/firebase');
const Users = require('../models/UsersModel');
const Performance = require('../models/Dojo/PerformanceModel');

const AdminController = {
  getUsers: async (req, res) => {
    try {
      const users = await Users.find().select('-__v -password').sort({ username: 1 });
      return res.json({ success: true, users });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Erro ao buscar usuários.' });
    }
  },

  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (updates.type && !['athlete', 'responsavel', 'sensei', 'admin', 'praticinador'].includes(updates.type)) {
        return res.status(400).json({ success: false, message: 'Tipo de usuário inválido.' });
      }

      const user = await Users.findByIdAndUpdate(id, updates, { new: true });
      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
      }
      return res.json({ success: true, user });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Erro ao atualizar usuário.' });
    }
  },

  resetRanking: async (req, res) => {
    try {
      await Users.updateMany({ type: { $in: ['athlete', 'atleta', 'praticinador'] } }, { $set: { points: 0 } });
      await Performance.updateMany({}, { $set: { points: 0 } });
      return res.json({ success: true, message: 'Rankings reiniciados.' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Erro ao reiniciar ranking.' });
    }
  },

  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await Users.findById(id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
      }

      const authUid = user.authUid;
      await Users.findByIdAndDelete(id);

      if (authUid) {
        try {
          await admin.auth().deleteUser(authUid);
        } catch (firebaseError) {
          console.warn('Firebase user delete failed:', firebaseError.message || firebaseError);
        }
      }

      return res.json({ success: true, message: 'Usuário removido.' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Erro ao remover usuário.' });
    }
  }
};

module.exports = AdminController;
