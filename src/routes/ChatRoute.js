const express = require("express");
const app = express();
app.use(express.json());

const ChatController = require("../controllers/ChatController");
const verifyToken = require("../middlewares/is_auth");

app.get("/conversations", verifyToken, ChatController.getConversations);
app.get("/conversations/:conversationId/messages", verifyToken, ChatController.getMessages);
app.post("/messages", verifyToken, ChatController.sendMessage);

module.exports = app;