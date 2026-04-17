const mongoose = require("mongoose");

const ComunidadeModel = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    imagens: {
        type: [String],
        default: []
    },
    community: {
        type: String,
        enum: ['geral', 'dojo'],
        default: 'geral'
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    }],
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'comments'
    }]
}, { timestamps: true });

const Comunidade = mongoose.model("posts", ComunidadeModel);
module.exports = Comunidade;