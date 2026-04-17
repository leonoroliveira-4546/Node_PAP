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
    type: {
        type: String,
        enum: ['news', 'tournament'],
        default: 'news'
    }
}, { timestamps: true });

const News = mongoose.model("news", NewsModel);
module.exports = News;