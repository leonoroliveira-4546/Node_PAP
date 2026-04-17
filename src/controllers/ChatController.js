const mongoose = require("mongoose");
const Conversation = require("../models/Chat/ConversationModel");
const Message = require("../models/Chat/MessageModel");
const User = require("../models/UsersModel");
const Dojo = require("../models/Dojo/DojosModel");

// Helper to get dojo for a user
const getDojo = async (userId) => {
    const dojo = await Dojo.findOne({
        $or: [
            { sensei: userId },
            { members: userId }
        ]
    });
    return dojo;
};

// Helper to check if two users can chat
const canChat = async (userA, userB) => {
    const dojoA = await getDojo(userA._id);
    const dojoB = await getDojo(userB._id);

    if (!dojoA || !dojoB || dojoA._id.toString() !== dojoB._id.toString()) return false;

    if (userA.type === 'sensei') {
        return (userB.type === 'athlete' || userB.type === 'responsavel') && dojoA.members.includes(userB._id);
    }
    if (userA.type === 'responsavel') {
        if (userB.type === 'sensei') {
            return dojoA.sensei.toString() === userB._id.toString();
        }
        if (userB.type === 'athlete') {
            return userB.responsavelId && userB.responsavelId.toString() === userA._id.toString();
        }
    }
    if (userA.type === 'athlete') {
        if (userB.type === 'sensei') {
            return dojoA.sensei.toString() === userB._id.toString();
        }
        if (userB.type === 'responsavel') {
            return userA.responsavelId && userA.responsavelId.toString() === userB._id.toString();
        }
    }
    return false;
};

// Get conversations for a user
const getConversations = async (req, res, next) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user._id); // Assuming req.user from auth middleware

        const conversations = await Conversation.find({ participants: userId }).populate('participants', 'username profilePic type');

        const existingOtherUsers = new Set();

        // Get existing other users
        if(conversations) {
            for (const conv of conversations) {
                const other = conv.participants?.find(
                    p => p._id.toString() !== userId.toString()
                );

                if (other) {
                    existingOtherUsers.add(other._id.toString());
                }
            }
        }
        
        // Get possible recipients
        const user = await User.findById(userId);
        const possibleRecipients = await getPossibleRecipients(user);

        // Create missing conversations
        for (const recipient of possibleRecipients) {
            if (!existingOtherUsers.has(recipient._id.toString())) {
                const participants = [userId, recipient._id].sort((a, b) => a.toString().localeCompare(b.toString()));
                const newConv = new Conversation({ participants });
                await newConv.save();
                // Add to conversations list
                conversations.push(await Conversation.findById(newConv._id).populate('participants', 'username profilePic type'));
            }
        }

        const result = await Promise.all(conversations.map(async (conv) => {
            const otherParticipant = conv.participants.find(p => p._id.toString() !== userId.toString());
            const lastMessage = await Message.findOne({ conversationId: conv._id }).sort({ timestamp: -1 });

            return {
                _id: conv._id,
                title: otherParticipant.username,
                lastMessage: lastMessage ? lastMessage.content : '',
                timestamp: lastMessage ? lastMessage.timestamp : conv.createdAt,
                otherUser: {
                    _id: otherParticipant._id,
                    username: otherParticipant.username,
                    profilePic: otherParticipant.profilePic,
                    type: otherParticipant.type
                }
            };
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get messages for a conversation
const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;

        // Check if user is participant
        const conv = await Conversation.findOne({ _id: conversationId, participants: userId });
        if (!conv) return res.status(403).json({ error: 'Not authorized' });

        const messages = await Message.find({ conversationId }).populate('senderId', 'username profilePic').sort({ timestamp: 1 });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Send a message
const sendMessage = async (req, res) => {
    try {
        const { recipientId, content } = req.body;
        const senderId = req.user._id;

        const sender = await User.findById(senderId);
        const recipient = await User.findById(recipientId);

        if (!sender || !recipient) return res.status(404).json({ error: 'User not found' });

        const allowed = await canChat(sender, recipient);
        if (!allowed) return res.status(403).json({ error: 'Cannot chat with this user' });

        // Find or create conversation
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, recipientId], $size: 2 }
        });

        if (!conversation) {
            const participants = [senderId, recipientId].sort((a, b) => a.toString().localeCompare(b.toString()));
            conversation = new Conversation({ participants });
            await conversation.save();
        }

        const message = new Message({
            conversationId: conversation._id,
            senderId,
            content
        });

        await message.save();

        res.json(message);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getConversations,
    getMessages,
    sendMessage
};