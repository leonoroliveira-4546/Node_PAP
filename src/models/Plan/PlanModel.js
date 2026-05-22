const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  period: { type: String, required: true },
  description: { type: String, required: true },
  features: [{ type: String }],
  color: { type: String, default: 'primary' },
  popular: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', default: null }
}, { timestamps: true });

module.exports = mongoose.model('plans', PlanSchema);
