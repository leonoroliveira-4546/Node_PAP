const Plan = require('../models/Plan/PlanModel');

const PlansController = {
  getPlans: async (req, res) => {
    try {
      const plans = await Plan.find({ active: true }).sort({ price: 1 });
      return res.json({ success: true, plans });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Erro ao buscar planos.' });
    }
  },

  createPlan: async (req, res) => {
    try {
      const { name, price, period, description, features, popular, active } = req.body;
      const plan = await Plan.create({
        name,
        price,
        period,
        description,
        features: features || [],
        popular: Boolean(popular),
        active: active !== undefined ? Boolean(active) : true,
        createdBy: req.user._id
      });
      return res.status(201).json({ success: true, plan });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Erro ao criar plano.' });
    }
  },

  updatePlan: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const plan = await Plan.findByIdAndUpdate(id, updates, { new: true });
      if (!plan) {
        return res.status(404).json({ success: false, message: 'Plano não encontrado.' });
      }
      return res.json({ success: true, plan });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Erro ao atualizar plano.' });
    }
  }
};

module.exports = PlansController;
