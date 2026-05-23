const socketIO = require('socket.io')
const Message = require('../models/Chat/MessageModel')
const User = require('../models/UsersModel')

let io
const userSockets = {}; // Map userId to socket.id

const initializeSocket = (server) => {
    io = socketIO(server, {
        cors: {
            origin: ['http://localhost:8100', 'http://127.0.0.1:8100'],
            methods: ['GET', 'POST'],
            credentials: true
        }
    })

    io.on('connection', (socket) => {

        // User joins - store socket id
        socket.on('join', (userId) => {
            const id = userId.toString()

            if (socket.userId && socket.userId.toString() === id) {
                return
            }

            if (socket.userId && socket.userId.toString() !== id) {
                const oldId = socket.userId.toString()
                userSockets[oldId] = userSockets[oldId]?.filter(sid => sid !== socket.id) || []
                if (userSockets[oldId].length === 0) {
                    delete userSockets[oldId]
                }
            }

            if (!userSockets[id]) {
                userSockets[id] = []
            }

            if (!userSockets[id].includes(socket.id)) {
                userSockets[id].push(socket.id)
            }

            socket.userId = id

        })

        // Join room for conversation
        socket.on('join_room', (conversationId) => {
            socket.join(conversationId)

        })

        // Listen for new messages
        socket.on('send_message', async (data) => {
            try {
                const { conversationId, recipientId, content } = data
                const senderId = socket.userId

                // Save message to database
                const message = new Message({
                    conversationId,
                    senderId,
                    content
                })
                await message.save()

                // Populate sender details
                const populatedMessage = await Message.findById(message._id).populate('senderId', 'username profilePic')

                // Send to conversation room
                io.to(conversationId).emit('receive_message', {
                    conversationId,
                    message: populatedMessage
                })
            } catch (error) {
                socket.emit('error', { message: error.message })
            }
        })

        // User disconnects
        socket.on('disconnect', () => {
            const userId = socket.userId

            if (userId && userSockets[userId]) {
                userSockets[userId] = userSockets[userId].filter(id => id !== socket.id)

                if (userSockets[userId].length === 0) {
                    delete userSockets[userId]
                }
            }

        })
    })

    return io
}

const getIO = () => io

module.exports = {
    initializeSocket,
    getIO
}