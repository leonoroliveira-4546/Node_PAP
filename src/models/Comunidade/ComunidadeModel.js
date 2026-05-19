const mongoose = require("mongoose");

const AttachmentSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['image', 'video', 'link'],
        required: true
    },
    url: {
        type: String,
        required: true
    },
    title: String
}, { _id: false });

const PollOptionSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    votes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    }]
}, { _id: false });

const PollSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    options: [PollOptionSchema],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    }
}, { _id: false });

const ContentSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    type: {
        type: String,
        enum: ['post', 'news', 'tournament'],
        default: 'post'
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        default: ''
    },
    content: {
        type: String,
        default: ''
    },
    link: {
        type: String,
        default: ''
    },
    imagens: {
        type: [String],
        default: []
    },
    attachments: {
        type: [AttachmentSchema],
        default: []
    },
    community: {
        type: String,
        enum: ['geral', 'dojo'],
        default: 'geral'
    },
    dojo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'dojos',
        default: null
    },
    poll: {
        type: PollSchema,
        default: null
    },
    isImportant: {
        type: Boolean,
        default: false
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

module.exports = mongoose.model("contents", ContentSchema);