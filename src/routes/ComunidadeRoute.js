const express = require("express")
const app = express()

const ComunidadeController = require('../controllers/ComunidadeController')
const verifyToken = require("../middlewares/is_auth")
const { upload } = require("../middlewares/upload")

// CONTENTS
app.get('/contents', verifyToken, ComunidadeController.getContents)
app.get('/contents/:id', verifyToken, ComunidadeController.getContentDetails)
app.post('/contents', verifyToken, upload.single("file"), ComunidadeController.createContent)
app.put('/contents/:id', verifyToken, upload.single("file"), ComunidadeController.updateContent)
app.delete('/contents/:id', verifyToken, ComunidadeController.deleteContent)

app.post('/contents/:id/like', verifyToken, ComunidadeController.likeContent)
app.post('/contents/:id/poll/:optionIndex/vote', verifyToken, ComunidadeController.votePoll)

app.post('/contents/:id/comments', verifyToken, ComunidadeController.addComment)
app.put('/comments/:id', verifyToken, ComunidadeController.editComment)
app.delete('/comments/:id', verifyToken, ComunidadeController.removeComment)

module.exports = app