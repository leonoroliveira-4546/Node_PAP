const mongoose = require("mongoose");

const NewsModel = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    imagens: [{
        type: String
    }],
    link: {
        type: String
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    type: {
        type: String,
        enum: ['news', 'tournament'],
        default: 'news'
    }
}, { timestamps: true });

const News = mongoose.model("news", NewsModel);
module.exports = News;
