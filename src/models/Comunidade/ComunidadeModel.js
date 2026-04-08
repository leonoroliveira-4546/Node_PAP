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
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'comments'
    }]
}, { timestamps: true });

const Comunidade = mongoose.model("posts", ComunidadeModel);
module.exports = Comunidade;