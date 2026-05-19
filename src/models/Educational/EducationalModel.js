const mongoose = require('mongoose');

const EducationalSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  url: { type: String, required: true },
  contentType: { type: String, default: 'video' },
  published: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', default: null }
}, { timestamps: true });

module.exports = mongoose.model('educational', EducationalSchema);
