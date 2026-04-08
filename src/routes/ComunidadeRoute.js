const express = require("express");
const app = express();

const ComunidadeController = require('../controllers/ComunidadeController');
const verifyToken = require("../middlewares/is_auth");
const { upload } = require("../middlewares/upload");

// POSTS
app.get('/comunidade', verifyToken, ComunidadeController.getPosts);
app.post('/posts', verifyToken, upload.single("file"), ComunidadeController.createPost);
app.get('/posts/:id', verifyToken, ComunidadeController.getPostDetails);
app.put('/posts/:id', verifyToken, ComunidadeController.updatePost);
app.delete('/posts/:id', verifyToken, ComunidadeController.deletePost);

// COMMENTS
app.post('/posts/:id/comments', verifyToken, ComunidadeController.addComment);
app.put('/comments/:id', verifyToken, ComunidadeController.editComment);
app.delete('/comments/:id', verifyToken, ComunidadeController.removeComment);

module.exports = app;