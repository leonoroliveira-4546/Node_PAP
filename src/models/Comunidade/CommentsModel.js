const mongoose = require("mongoose")

const CommentsModel = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'posts',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  replies: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'comments' 
  }]
}, { timestamps: true })

const Comentario = mongoose.model('comments', CommentsModel)
module.exports = Comentario