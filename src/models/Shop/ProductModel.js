const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, default: 'Acessório' },
  price: { type: Number, required: true, default: 0 },
  originalPrice: { type: Number, default: null },
  rating: { type: Number, default: 4.5 },
  reviewCount: { type: Number, default: 0 },
  inStock: { type: Boolean, default: true },
  badge: { type: String, default: null },
  image: { type: String, default: null },
  published: { type: Boolean, default: true },
  status: { type: String, enum: ['pendente', 'aprovado', 'rejeitado'], default: 'pendente' },
  availableForPraticinador: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', default: null }
}, { timestamps: true });

module.exports = mongoose.model('products', ProductSchema);
