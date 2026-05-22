const mongoose = require('mongoose');

const EducationalSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  url: { type: String },
  contentType: { type: String, default: 'video' },
  published: { type: Boolean, default: true },
  gameData: {
    question: { type: String, default: '' },
    options: { type: [String], default: [] },
    correctAnswer: { type: String, default: '' },
    points: { type: Number, default: 20 }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', default: null }
}, { timestamps: true });

module.exports = mongoose.model('educational', EducationalSchema);
