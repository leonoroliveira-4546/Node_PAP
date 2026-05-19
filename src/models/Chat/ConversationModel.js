const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});
ConversationSchema.index({ participants: 1 }, { unique: true });

const Conversation = mongoose.model("conversations", ConversationSchema);
module.exports = Conversation;