const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  products: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'products', required: true },
    name: String,
    price: Number,
    quantity: { type: Number, default: 1 }
  }],
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['pendente', 'aprovado', 'rejeitado', 'enviado', 'entregue'], default: 'pendente' },
  orderDate: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('orders', OrderSchema);
